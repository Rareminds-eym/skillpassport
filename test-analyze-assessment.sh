#!/bin/bash

# Test Analyze Assessment API
# Tests the migrated analyze-assessment Pages Function

BASE_URL="http://localhost:8788"
API_PATH="/api/analyze-assessment"

echo "=========================================="
echo "Testing Analyze Assessment API"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "GET ${BASE_URL}${API_PATH}/health"
echo ""
curl -s "${BASE_URL}${API_PATH}/health" | jq '.'
echo ""
echo ""

# Test 2: Analyze Assessment (with sample data)
echo "Test 2: Analyze Assessment (Sample Data)"
echo "POST ${BASE_URL}${API_PATH}/analyze"
echo ""

# Create sample assessment data
cat > /tmp/sample-assessment.json << 'EOF'
{
  "assessmentData": {
    "stream": "science",
    "gradeLevel": "after12",
    "riasecAnswers": {
      "q1": {
        "question": "I enjoy working with tools and machines",
        "answer": 5,
        "categoryMapping": {"5": "R"}
      },
      "q2": {
        "question": "I like solving complex problems",
        "answer": 5,
        "categoryMapping": {"5": "I"}
      }
    },
    "aptitudeScores": {
      "verbal": {"correct": 8, "total": 10, "percentage": 80},
      "numerical": {"correct": 9, "total": 10, "percentage": 90},
      "abstract": {"correct": 7, "total": 10, "percentage": 70},
      "spatial": {"correct": 6, "total": 10, "percentage": 60},
      "clerical": {"correct": 7, "total": 10, "percentage": 70}
    },
    "aptitudeAnswers": {
      "verbal": [],
      "numerical": [],
      "abstract": [],
      "spatial": [],
      "clerical": []
    },
    "bigFiveAnswers": {
      "o1": {"question": "I am curious", "answer": 5},
      "o2": {"question": "I am creative", "answer": 4},
      "o3": {"question": "I like new ideas", "answer": 5},
      "o4": {"question": "I am imaginative", "answer": 4},
      "o5": {"question": "I am open-minded", "answer": 5},
      "o6": {"question": "I am innovative", "answer": 4},
      "c1": {"question": "I am organized", "answer": 4},
      "c2": {"question": "I am disciplined", "answer": 4},
      "c3": {"question": "I am reliable", "answer": 5},
      "c4": {"question": "I am thorough", "answer": 4},
      "c5": {"question": "I am punctual", "answer": 4},
      "c6": {"question": "I am responsible", "answer": 5},
      "e1": {"question": "I am outgoing", "answer": 3},
      "e2": {"question": "I am sociable", "answer": 3},
      "e3": {"question": "I am energetic", "answer": 4},
      "e4": {"question": "I am talkative", "answer": 3},
      "e5": {"question": "I am assertive", "answer": 3},
      "e6": {"question": "I am enthusiastic", "answer": 4},
      "a1": {"question": "I am kind", "answer": 4},
      "a2": {"question": "I am helpful", "answer": 4},
      "a3": {"question": "I am cooperative", "answer": 4},
      "a4": {"question": "I am empathetic", "answer": 4},
      "a5": {"question": "I am trusting", "answer": 3},
      "a6": {"question": "I am compassionate", "answer": 4},
      "n1": {"question": "I am calm", "answer": 4},
      "n2": {"question": "I am relaxed", "answer": 3},
      "n3": {"question": "I am stable", "answer": 4},
      "n4": {"question": "I am confident", "answer": 4},
      "n5": {"question": "I am secure", "answer": 4},
      "n6": {"question": "I am resilient", "answer": 4}
    },
    "workValuesAnswers": {
      "impact1": {"question": "Making a difference", "answer": 5},
      "impact2": {"question": "Helping others", "answer": 4},
      "impact3": {"question": "Social contribution", "answer": 4},
      "autonomy1": {"question": "Independence", "answer": 4},
      "autonomy2": {"question": "Freedom", "answer": 4},
      "autonomy3": {"question": "Self-direction", "answer": 5},
      "achievement1": {"question": "Success", "answer": 5},
      "achievement2": {"question": "Excellence", "answer": 5},
      "achievement3": {"question": "Recognition", "answer": 4}
    },
    "employabilityAnswers": {
      "selfRating": {
        "communication": [
          {"question": "Written communication", "answer": 4, "domain": "communication"},
          {"question": "Verbal communication", "answer": 4, "domain": "communication"}
        ],
        "problemSolving": [
          {"question": "Critical thinking", "answer": 5, "domain": "problemSolving"},
          {"question": "Analytical skills", "answer": 5, "domain": "problemSolving"}
        ]
      },
      "sjt": []
    },
    "knowledgeAnswers": {
      "k1": {"question": "Physics concept", "studentAnswer": "A", "correctAnswer": "A", "isCorrect": true},
      "k2": {"question": "Math concept", "studentAnswer": "B", "correctAnswer": "B", "isCorrect": true}
    },
    "totalKnowledgeQuestions": 20,
    "totalAptitudeQuestions": 50,
    "sectionTimings": {
      "totalTime": 3600,
      "totalFormatted": "1h 0m"
    }
  }
}
EOF

# Send request with dev mode header
curl -s -X POST "${BASE_URL}${API_PATH}/analyze" \
  -H "Content-Type: application/json" \
  -H "X-Dev-Mode: true" \
  -d @/tmp/sample-assessment.json | jq '.'

echo ""
echo ""
echo "=========================================="
echo "Test Complete!"
echo "=========================================="
