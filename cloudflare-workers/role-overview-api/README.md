# Role Overview API

Cloudflare Worker for generating comprehensive career role overview data for the Career Clusters Modal.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/role-overview` | Generate role overview data |

## POST /role-overview

Generates comprehensive role overview data with a 3-tier fallback chain:
1. **OpenRouter** (primary) - Uses GPT-4o-mini
2. **Gemini** (fallback) - Uses Gemini 1.5 Flash
3. **Static Fallback** - Returns generic data if both AI services fail

### Request Body

```json
{
  "roleName": "Software Engineer",
  "clusterTitle": "Technology"
}
```

### Response

```json
{
  "success": true,
  "source": "openrouter",
  "data": {
    "responsibilities": ["...", "...", "..."],
    "industryDemand": {
      "description": "...",
      "demandLevel": "High",
      "demandPercentage": 78
    },
    "careerProgression": [...],
    "learningRoadmap": [...],
    "recommendedCourses": [...],
    "freeResources": [...],
    "actionItems": [...]
  }
}
```

## Setup

### 1. Install dependencies

```bash
cd cloudflare-workers/role-overview-api
npm install
```

### 2. Set secrets

```bash
wrangler secret put OPENROUTER_API_KEY
wrangler secret put GEMINI_API_KEY
```

### 3. Deploy

```bash
npm run deploy
```

## Local Development

```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key (primary) |
| `GEMINI_API_KEY` | Google Gemini API key (fallback) |

## Folder Structure

```
role-overview-api/
├── src/
│   ├── index.ts              # Main entry point & routing
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── handlers/
│   │   └── roleOverviewHandler.ts  # Request handler
│   ├── services/
│   │   ├── openRouterService.ts    # OpenRouter API calls
│   │   ├── geminiService.ts        # Gemini API calls
│   │   └── fallbackService.ts      # Static fallback data
│   ├── prompts/
│   │   └── roleOverviewPrompt.ts   # AI prompt templates
│   └── utils/
│       ├── cors.ts           # CORS handling
│       └── parser.ts         # Response parsing
├── package.json
├── tsconfig.json
├── wrangler.toml
└── README.md
```
