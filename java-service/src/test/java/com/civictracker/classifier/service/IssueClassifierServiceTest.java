package com.civictracker.classifier.service;

import com.civictracker.classifier.model.ClassificationRequest;
import com.civictracker.classifier.model.ClassificationResponse;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IssueClassifierServiceTest {

    private final IssueClassifierService service = new IssueClassifierService();

    @Test
    void classifiesPotholeAsRoadsInfrastructure() {
        ClassificationResponse result = service.classify(new ClassificationRequest(
                "Big pothole on Main Street",
                "There is a deep pothole causing damage to vehicles."
        ));

        assertThat(result.category()).isEqualTo("Roads & Infrastructure");
        assertThat(result.priority()).isEqualTo("Medium");
    }

    @Test
    void classifiesGasLeakAsCriticalPublicSafety() {
        ClassificationResponse result = service.classify(new ClassificationRequest(
                "Gas leak emergency near school",
                "This is an emergency, there is a fire risk from a gas leak."
        ));

        assertThat(result.priority()).isEqualTo("Critical");
    }

    @Test
    void fallsBackToOtherWhenNoKeywordsMatch() {
        ClassificationResponse result = service.classify(new ClassificationRequest(
                "General feedback",
                "Just wanted to say the new app design looks nice."
        ));

        assertThat(result.category()).isEqualTo("Other");
        assertThat(result.priority()).isEqualTo("Medium");
    }

    @Test
    void classifiesGarbagePileAsWasteManagement() {
        ClassificationResponse result = service.classify(new ClassificationRequest(
                "Garbage pile not collected",
                "Trash and litter have piled up near the dump site for a week."
        ));

        assertThat(result.category()).isEqualTo("Waste Management");
    }
}
