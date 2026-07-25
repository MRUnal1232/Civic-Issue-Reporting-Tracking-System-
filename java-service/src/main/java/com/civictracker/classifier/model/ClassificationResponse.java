package com.civictracker.classifier.model;

import java.util.List;

public record ClassificationResponse(
        String category,
        String priority,
        double confidence,
        List<String> matchedKeywords
) {
}
