# AI Service Implementation

## Overview

The application uses a hybrid AI approach:
- **Claude** - All chat/completion tasks (cheapest haiku model)
- **Gemini** - Embeddings only (text-embedding-004)

## Configuration

Add to your `.env` file:
```env
# Claude for chat/completion
VITE_CLAUDE_API_KEY=sk-ant-api03-your-key-here

# Gemini for embeddings only
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

## Services

| Service | AI Provider | Purpose |
|---------|-------------|---------|
| `claudeService.js` | Claude | Centralized chat API |
| `embeddingService.js` | Gemini | Vector embeddings |
| `aiJobMatchingService.js` | Claude | Job matching |
| `resumeParserService.js` | Claude | Resume parsing |
| `geminiAssessmentService.js` | Claude | Assessment analysis |
| `courseRecommendationService.js` | Gemini (embeddings) | Course recommendations |

## Usage

### Claude (Chat/Completion)
```javascript
import { callClaude, callClaudeJSON } from './services/claudeService';

const text = await callClaude('Your prompt', { maxTokens: 1000 });
const data = await callClaudeJSON('Return JSON...', { maxTokens: 500 });
```

### Gemini (Embeddings)
```javascript
import { generateEmbedding, cosineSimilarity } from './services/embeddingService';

const embedding = await generateEmbedding('Python programming');
const similarity = cosineSimilarity(embedding1, embedding2);
```

## Models Used

| Provider | Model | Cost |
|----------|-------|------|
| Claude | claude-3-haiku-20240307 | $0.25/M input, $1.25/M output |
| Gemini | text-embedding-004 | Free tier available |

## Features

- **Automatic Retries**: Exponential backoff for rate limits
- **Response Caching**: 5-minute cache for Claude
- **Keyword Fallback**: If embeddings fail, uses keyword matching
