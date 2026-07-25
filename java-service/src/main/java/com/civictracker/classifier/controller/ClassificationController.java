package com.civictracker.classifier.controller;

import com.civictracker.classifier.model.ClassificationRequest;
import com.civictracker.classifier.model.ClassificationResponse;
import com.civictracker.classifier.service.IssueClassifierService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ClassificationController {

    private final IssueClassifierService classifierService;

    public ClassificationController(IssueClassifierService classifierService) {
        this.classifierService = classifierService;
    }

    @PostMapping("/api/classify")
    public ClassificationResponse classify(@RequestBody ClassificationRequest request) {
        return classifierService.classify(request);
    }
}
