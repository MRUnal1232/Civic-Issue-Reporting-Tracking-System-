package com.civictracker.classifier.service;

import com.civictracker.classifier.model.ClassificationRequest;
import com.civictracker.classifier.model.ClassificationResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Keyword-based classifier for civic issue reports. Scores the reported text against
 * a keyword list per category and per priority level, picking the highest-scoring match.
 * Category and priority labels are kept identical to the enums in the Node backend's
 * Issue model so the suggestion can be stored or auto-applied without translation.
 */
@Service
public class IssueClassifierService {

    private static final String DEFAULT_CATEGORY = "Other";
    private static final String DEFAULT_PRIORITY = "Medium";

    private static final Map<String, List<String>> CATEGORY_KEYWORDS = new LinkedHashMap<>();
    private static final Map<String, List<String>> PRIORITY_KEYWORDS = new LinkedHashMap<>();

    static {
        CATEGORY_KEYWORDS.put("Roads & Infrastructure", List.of(
                "pothole", "road", "street", "sidewalk", "bridge", "pavement",
                "highway", "footpath", "crack", "asphalt", "curb"));
        CATEGORY_KEYWORDS.put("Water & Sanitation", List.of(
                "water", "sewage", "drain", "leak", "pipe", "sewer",
                "drainage", "flooding", "contaminat", "toilet", "sanitation"));
        CATEGORY_KEYWORDS.put("Electricity", List.of(
                "power", "electric", "outage", "transformer", "wire", "streetlight",
                "voltage", "blackout", "cable", "utility pole"));
        CATEGORY_KEYWORDS.put("Waste Management", List.of(
                "garbage", "trash", "waste", "litter", "dump", "recycl", "bin", "rubbish"));
        CATEGORY_KEYWORDS.put("Public Safety", List.of(
                "crime", "theft", "assault", "unsafe", "danger", "harassment",
                "violence", "robbery", "weapon", "stalking"));
        CATEGORY_KEYWORDS.put("Environment", List.of(
                "pollution", "tree", "air quality", "noise", "smoke", "dust",
                "deforestation", "wildlife", "emission"));
        CATEGORY_KEYWORDS.put("Healthcare", List.of(
                "hospital", "clinic", "medicine", "doctor", "disease", "epidemic",
                "health", "ambulance", "medical"));
        CATEGORY_KEYWORDS.put("Education", List.of(
                "school", "teacher", "student", "classroom", "education",
                "textbook", "university", "college"));
        CATEGORY_KEYWORDS.put("Transportation", List.of(
                "bus", "traffic", "train", "transit", "parking", "vehicle",
                "signal", "congestion", "taxi"));

        PRIORITY_KEYWORDS.put("Critical", List.of(
                "emergency", "life-threatening", "life threatening", "fatal",
                "collapse", "fire", "explosion", "dying"));
        PRIORITY_KEYWORDS.put("High", List.of(
                "urgent", "severe", "dangerous", "serious", "injury", "major", "immediately"));
        PRIORITY_KEYWORDS.put("Low", List.of(
                "minor", "small", "cosmetic", "non-urgent", "whenever"));
    }

    public ClassificationResponse classify(ClassificationRequest request) {
        String text = normalize(
                (request.title() == null ? "" : request.title()) + " " +
                (request.description() == null ? "" : request.description())
        );

        ScoredMatch categoryMatch = bestMatch(text, CATEGORY_KEYWORDS);
        ScoredMatch priorityMatch = bestMatch(text, PRIORITY_KEYWORDS);

        String category = categoryMatch.label() == null ? DEFAULT_CATEGORY : categoryMatch.label();
        String priority = priorityMatch.label() == null ? DEFAULT_PRIORITY : priorityMatch.label();

        List<String> matched = new ArrayList<>(categoryMatch.keywords());
        matched.addAll(priorityMatch.keywords());

        int wordCount = Math.max(text.split("\\s+").length, 1);
        double confidence = Math.min(1.0, (double) matched.size() / Math.min(wordCount, 10));

        return new ClassificationResponse(category, priority, round(confidence), matched);
    }

    private ScoredMatch bestMatch(String text, Map<String, List<String>> keywordsByLabel) {
        String bestLabel = null;
        List<String> bestKeywords = List.of();
        int bestScore = 0;

        for (Map.Entry<String, List<String>> entry : keywordsByLabel.entrySet()) {
            List<String> hits = new ArrayList<>();
            for (String keyword : entry.getValue()) {
                if (text.contains(keyword)) {
                    hits.add(keyword);
                }
            }
            if (hits.size() > bestScore) {
                bestScore = hits.size();
                bestLabel = entry.getKey();
                bestKeywords = hits;
            }
        }

        return new ScoredMatch(bestLabel, bestKeywords);
    }

    private String normalize(String text) {
        return text.toLowerCase().trim();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record ScoredMatch(String label, List<String> keywords) {
    }
}
