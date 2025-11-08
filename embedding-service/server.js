/**
 * Transformers.js Embedding API Service
 * Deploy to Render.com free tier
 */

import express from 'express';
import { pipeline } from '@xenova/transformers';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize model (loads once on startup)
let embeddingPipeline = null;

async function initializeModel() {
  if (!embeddingPipeline) {
    console.log('🔄 Loading embedding model...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('✅ Model loaded!');
  }
  return embeddingPipeline;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    model: embeddingPipeline ? 'loaded' : 'loading' 
  });
});

// Generate embedding endpoint
app.post('/embed', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid "text" field' 
      });
    }

    // Initialize model if needed
    const model = await initializeModel();

    // Generate embedding
    console.log(`📝 Generating embedding for text of length ${text.length}`);
    const output = await model(text, { pooling: 'mean', normalize: true });

    // Convert to array and pad to 1536 dimensions
    let embedding = Array.from(output.data);
    while (embedding.length < 1536) {
      embedding.push(0);
    }
    embedding = embedding.slice(0, 1536);

    console.log(`✅ Generated ${embedding.length}-dimensional embedding`);

    res.json({
      success: true,
      embedding,
      dimensions: embedding.length
    });

  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch embeddings endpoint (for bulk operations)
app.post('/embed/batch', async (req, res) => {
  try {
    const { texts } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid "texts" array' 
      });
    }

    if (texts.length > 100) {
      return res.status(400).json({ 
        error: 'Maximum 100 texts per batch request' 
      });
    }

    const model = await initializeModel();
    const embeddings = [];

    console.log(`📝 Generating ${texts.length} embeddings`);

    for (const text of texts) {
      const output = await model(text, { pooling: 'mean', normalize: true });
      let embedding = Array.from(output.data);
      while (embedding.length < 1536) {
        embedding.push(0);
      }
      embedding = embedding.slice(0, 1536);
      embeddings.push(embedding);
    }

    console.log(`✅ Generated ${embeddings.length} embeddings`);

    res.json({
      success: true,
      embeddings,
      count: embeddings.length
    });

  } catch (error) {
    console.error('❌ Error generating batch embeddings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server and preload model
async function start() {
  console.log('🚀 Starting Embedding Service...');
  
  // Preload model on startup
  await initializeModel();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`📡 Health: http://localhost:${PORT}/health`);
    console.log(`🔗 Embed: POST http://localhost:${PORT}/embed`);
    console.log(`🔗 Batch: POST http://localhost:${PORT}/embed/batch\n`);
  });
}

start().catch(console.error);
