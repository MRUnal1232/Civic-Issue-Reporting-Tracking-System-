const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');

class IssueClassifier {
  constructor() {
    this.model = null;
    this.categories = [
      'Roads & Infrastructure',
      'Water & Sanitation', 
      'Electricity',
      'Waste Management',
      'Public Safety',
      'Environment',
      'Healthcare',
      'Education',
      'Transportation',
      'Other'
    ];
    this.isModelLoaded = false;
  }

  async loadModel() {
    try {
      // In a real implementation, you would load a pre-trained model
      // For now, we'll create a simple mock classifier
      console.log('Loading ML model for issue classification...');
      
      // Simulate model loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isModelLoaded = true;
      console.log('ML model loaded successfully');
    } catch (error) {
      console.error('Error loading ML model:', error);
      this.isModelLoaded = false;
    }
  }

  async preprocessImage(imageBuffer) {
    try {
      // Resize and normalize image for model input
      const processedImage = await sharp(imageBuffer)
        .resize(224, 224)
        .removeAlpha()
        .jpeg()
        .toBuffer();

      // Convert to tensor (this is a simplified version)
      // In a real implementation, you would convert to the proper tensor format
      return processedImage;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw error;
    }
  }

  async classifyIssue(imageBuffer, description = '') {
    try {
      if (!this.isModelLoaded) {
        await this.loadModel();
      }

      // Preprocess image
      const processedImage = await this.preprocessImage(imageBuffer);

      // Mock classification based on image analysis and text description
      // In a real implementation, this would use the actual ML model
      const classification = await this.mockClassify(processedImage, description);

      return {
        category: classification.category,
        confidence: classification.confidence,
        suggestions: classification.suggestions
      };
    } catch (error) {
      console.error('Error classifying issue:', error);
      return {
        category: 'Other',
        confidence: 0.1,
        suggestions: ['Unable to classify automatically. Please select category manually.']
      };
    }
  }

  async mockClassify(imageBuffer, description) {
    // This is a mock classifier that uses keyword matching
    // In a real implementation, this would use the actual ML model
    
    const text = description.toLowerCase();
    const keywords = {
      'Roads & Infrastructure': [
        'road', 'street', 'pothole', 'crack', 'asphalt', 'sidewalk', 'bridge', 'construction'
      ],
      'Water & Sanitation': [
        'water', 'pipe', 'leak', 'sewer', 'drain', 'flood', 'sanitation', 'toilet'
      ],
      'Electricity': [
        'power', 'electric', 'wire', 'pole', 'outage', 'light', 'cable', 'transformer'
      ],
      'Waste Management': [
        'garbage', 'trash', 'waste', 'dump', 'litter', 'recycle', 'bin', 'collection'
      ],
      'Public Safety': [
        'safety', 'danger', 'hazard', 'accident', 'crime', 'police', 'emergency', 'unsafe'
      ],
      'Environment': [
        'tree', 'park', 'green', 'pollution', 'air', 'noise', 'wildlife', 'nature'
      ],
      'Healthcare': [
        'hospital', 'clinic', 'medical', 'health', 'doctor', 'medicine', 'treatment'
      ],
      'Education': [
        'school', 'education', 'student', 'teacher', 'classroom', 'library', 'university'
      ],
      'Transportation': [
        'bus', 'train', 'metro', 'transport', 'traffic', 'parking', 'vehicle', 'station'
      ]
    };

    let bestMatch = 'Other';
    let bestScore = 0;
    const suggestions = [];

    // Check for keyword matches
    for (const [category, words] of Object.entries(keywords)) {
      let score = 0;
      const matchedWords = [];

      for (const word of words) {
        if (text.includes(word)) {
          score += 1;
          matchedWords.push(word);
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
        suggestions.push(...matchedWords);
      }
    }

    // Calculate confidence based on keyword matches
    const confidence = Math.min(0.9, 0.3 + (bestScore * 0.1));

    // Add some randomness to simulate ML model uncertainty
    const randomFactor = Math.random() * 0.2;
    const finalConfidence = Math.min(0.95, confidence + randomFactor);

    return {
      category: bestMatch,
      confidence: finalConfidence,
      suggestions: suggestions.slice(0, 3) // Top 3 suggestions
    };
  }

  async getCategorySuggestions(description) {
    try {
      const classification = await this.classifyIssue(Buffer.from(''), description);
      return {
        suggestedCategory: classification.category,
        confidence: classification.confidence,
        allCategories: this.categories.map(cat => ({
          name: cat,
          confidence: cat === classification.category ? classification.confidence : Math.random() * 0.3
        })).sort((a, b) => b.confidence - a.confidence)
      };
    } catch (error) {
      console.error('Error getting category suggestions:', error);
      return {
        suggestedCategory: 'Other',
        confidence: 0.1,
        allCategories: this.categories.map(cat => ({
          name: cat,
          confidence: Math.random() * 0.3
        }))
      };
    }
  }
}

// Create singleton instance
const issueClassifier = new IssueClassifier();

module.exports = issueClassifier;
