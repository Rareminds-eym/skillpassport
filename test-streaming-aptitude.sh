#!/bin/bash

echo "Testing Streaming Aptitude Questions..."
echo "========================================"
echo ""

curl -N -X POST http://localhost:8788/api/question-generation/career-assessment/generate-aptitude/stream \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "engineering",
    "gradeLevel": "college"
  }' 2>/dev/null | head -20

echo ""
echo ""
echo "========================================"
echo "✅ Streaming test complete!"
echo "Note: Only showing first 20 events for brevity"
