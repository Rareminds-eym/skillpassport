/**
 * Unified Embedding Handler - Smart embedding generation
 * 
 * This handler supports TWO modes:
 * 
 * MODE 1: Direct Text (when you already have the text)
 * POST /api/career/generate-embedding
 * {
 *   "text": "React Developer with 5 years...",
 *   "table": "opportunities",
 *   "id": "uuid"
 * }
 * 
 * MODE 2: From Database (automatic data fetching)
 * POST /api/career/generate-embedding
 * {
 *   "table": "students",
 *   "id": "uuid",
 *   "fromDatabase": true  // ← This triggers DB fetch
 * }
 * 
 * Features:
 * - Generates embeddings using dedicated embedding worker (port 9004)
 * - Automatically fetches and builds text from database when needed
 * - Returns embedding vectors (1536 dimensions)
 * - Optionally updates database
 * - Security: validates ownership and permissions
 * 
 * Configuration:
 * - Requires EMBEDDING_API_URL environment variable
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser, isValidUUID } from '../../shared/auth';
import { checkRateLimit } from '../../career/utils/rate-limit';
import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import { callEmbeddingWorker } from '../services/embeddingWorkerClient';
import {
  buildStudentTextFromDatabase,
  buildCourseTextFromDatabase,
  buildOpportunityTextFromDatabase,
} from '../services/textBuilder';
import { updateEmbedding } from '../services/databaseUpdater';
import { EmbeddingError } from '../types';
import { ALLOWED_TABLES, EMBEDDING_CONFIG } from '../config/constants';

interface GenerateEmbeddingRequest {
  // Mode 1: Direct text
  text?: string;
  
  // Mode 2: From database
  fromDatabase?: boolean;
  
  // Common fields
  table: string;
  id: string;
  returnEmbedding?: boolean;
  skipDatabaseUpdate?: boolean;
}

/**
 * Base type for database records with common fields
 */
interface DatabaseRecord {
  id: string;
  [key: string]: unknown;
}

/**
 * Entity configuration for text building and authorization
 */
interface EntityConfig {
  selectFields: string;
  buildText: (data: DatabaseRecord) => string;
  ownershipField?: string; // Field to check ownership (e.g., 'student_id')
  requiresAdmin?: boolean; // Whether admin privileges are required
  entityName?: string; // Human-readable entity name for error messages
}

const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  students: {
    selectFields: '*', // Will use buildStudentTextFromDatabase
    buildText: () => '', // Not used, handled separately
    ownershipField: 'id', // Special case: check id === studentId
    entityName: 'Student',
  },
  profiles: {
    selectFields: 'user_id',
    buildText: () => '', // Not used, handled separately
    ownershipField: 'user_id',
    entityName: 'Profile',
  },
  skills: {
    selectFields: 'name, description, student_id',
    buildText: (skill) => `Skill: ${skill.name}. ${skill.description || ''}`.trim(),
    ownershipField: 'student_id',
    entityName: 'Skill',
  },
  projects: {
    selectFields: 'title, role, organization, tech_stack, description, student_id',
    buildText: (project) => {
      let text = `Project: ${project.title}`;
      if (project.role) text += ` (Role: ${project.role})`;
      if (project.organization) text += ` at ${project.organization}`;
      if (project.tech_stack && Array.isArray(project.tech_stack) && project.tech_stack.length > 0) {
        text += `. Technologies: ${project.tech_stack.join(', ')}`;
      }
      if (project.description) text += `. ${project.description}`;
      return text.trim();
    },
    ownershipField: 'student_id',
    entityName: 'Project',
  },
  certificates: {
    selectFields: 'title, issuer, platform, level, category, instructor, description, student_id',
    buildText: (cert) => {
      let text = `Certificate: ${cert.title}`;
      if (cert.issuer) text += ` from ${cert.issuer}`;
      if (cert.platform) text += ` on ${cert.platform}`;
      if (cert.level) text += ` (${cert.level})`;
      if (cert.category) text += `. Category: ${cert.category}`;
      if (cert.instructor) text += `. Instructor: ${cert.instructor}`;
      if (cert.description) text += `. ${cert.description}`;
      return text.trim();
    },
    ownershipField: 'student_id',
    entityName: 'Certificate',
  },
  trainings: {
    selectFields: 'title, organization, source, description, student_id',
    buildText: (training) => {
      let text = `Training: ${training.title}`;
      if (training.organization) text += ` by ${training.organization}`;
      if (training.source) text += ` via ${training.source}`;
      if (training.description) text += `. ${training.description}`;
      return text.trim();
    },
    ownershipField: 'student_id',
    entityName: 'Training',
  },
  opportunities: {
    selectFields: '*', // Will use buildOpportunityTextFromDatabase
    buildText: () => '', // Not used, handled separately
    requiresAdmin: true,
    entityName: 'Opportunity',
  },
  courses: {
    selectFields: '*', // Will use buildCourseTextFromDatabase
    buildText: () => '', // Not used, handled separately
    requiresAdmin: true,
    entityName: 'Course',
  },
};

/**
 * Verify entity ownership for user-owned entities
 * SECURITY: This function performs authorization check atomically with data fetch
 * to prevent TOCTOU (Time-of-Check to Time-of-Use) race conditions
 */
async function verifyEntityOwnership(
  table: string,
  id: string,
  studentId: string,
  userSupabase: SupabaseClientType
): Promise<{ authorized: boolean; error?: string; data?: DatabaseRecord | null }> {
  const config = ENTITY_CONFIGS[table];
  if (!config) {
    return { authorized: false, error: `Unsupported table: ${table}` };
  }

  // Special case: students table checks id directly
  if (table === 'students') {
    if (id !== studentId) {
      return { authorized: false, error: 'Unauthorized: Cannot generate embedding for other users' };
    }
    // Fetch data atomically with authorization check
    const { data, error } = await userSupabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return { authorized: false, error: 'Student not found or access denied' };
    }
    
    return { authorized: true, data: data as unknown as DatabaseRecord };
  }

  // For entities with ownership field, verify ownership atomically with data fetch
  if (config.ownershipField) {
    const { data, error } = await userSupabase
      .from(table)
      .select(config.selectFields)
      .eq('id', id)
      .single();
    
    // Check if data exists and ownership matches in a single atomic check
    const ownershipField = config.ownershipField;
    if (error || !data || (data as unknown as Record<string, unknown>)[ownershipField] !== studentId) {
      return { 
        authorized: false, 
        error: `Unauthorized: Cannot generate embedding for other users' ${table}` 
      };
    }
    
    return { authorized: true, data: data as unknown as DatabaseRecord };
  }

  return { authorized: true };
}

/**
 * Verify admin privileges for admin-only entities
 */
async function verifyAdminPrivileges(
  studentId: string,
  userSupabase: SupabaseClientType
): Promise<{ authorized: boolean; error?: string }> {
  const [
    { data: adminCheck, error: adminError }, 
    { data: collegeAdminCheck, error: collegeError }
  ] = await Promise.all([
    userSupabase
      .from('school_admins')
      .select('id')
      .eq('user_id', studentId)
      .limit(1)
      .maybeSingle(),
    userSupabase
      .from('college_admins')
      .select('id')
      .eq('user_id', studentId)
      .limit(1)
      .maybeSingle()
  ]);
  
  // Check for query errors
  if (adminError || collegeError) {
    console.error('[Admin Check] Query error:', adminError || collegeError);
    return { 
      authorized: false, 
      error: 'Failed to verify admin privileges' 
    };
  }
  
  if (!adminCheck && !collegeAdminCheck) {
    return { 
      authorized: false, 
      error: 'Unauthorized: Admin access required for this operation' 
    };
  }

  return { authorized: true };
}

/**
 * Fetch data from database and build text using configuration
 * SECURITY: Uses pre-validated data when available to prevent race conditions
 */
async function fetchAndBuildText(
  table: string,
  id: string,
  supabase: SupabaseClientType,
  preValidatedData?: DatabaseRecord | null
): Promise<string> {
  // Use shared text builders for complex entities
  if (table === 'students') {
    return await buildStudentTextFromDatabase(supabase, id);
  } else if (table === 'opportunities') {
    return await buildOpportunityTextFromDatabase(supabase, id);
  } else if (table === 'courses') {
    return await buildCourseTextFromDatabase(supabase, id);
  }

  // Use configuration-driven approach for simple entities
  const config = ENTITY_CONFIGS[table];
  if (!config) {
    throw new EmbeddingError(
      `Unsupported table: ${table}`,
      'INVALID_TEXT',
      { table }
    );
  }

  // Use pre-validated data if available (prevents race condition)
  let data = preValidatedData;
  
  if (!data) {
    const result = await supabase
      .from(table)
      .select(config.selectFields)
      .eq('id', id)
      .single();
    
    if (result.error || !result.data) {
      // Use safe entity name from config instead of string manipulation
      const entityName = config.entityName || 'Entity';
      throw new EmbeddingError(
        `${entityName} not found: ${id}`,
        'INVALID_TEXT',
        { table, id }
      );
    }
    
    data = result.data as unknown as DatabaseRecord;
  }
  
  return config.buildText(data);
}

/**
 * Main handler - supports both direct text and database modes
 */
export async function handleGenerateEmbedding(
  request: Request,
  env: Record<string, string>
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { user } = auth;
  const studentId = user.id;

  if (!await checkRateLimit(studentId, env)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  let body: GenerateEmbeddingRequest;
  try {
    body = (await request.json()) as GenerateEmbeddingRequest;
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
  }

  const {
    text,
    fromDatabase = false,
    table,
    id,
    returnEmbedding = false,
    skipDatabaseUpdate = false,
  } = body;

  // Validate required fields based on mode
  if (!table || !id) {
    return jsonResponse(
      {
        success: false,
        error: 'Missing required parameters: table, id',
      },
      400
    );
  }

  // Mode validation
  if (!fromDatabase && !text) {
    return jsonResponse(
      {
        success: false,
        error: 'Missing required parameter: text (or set fromDatabase: true to fetch from DB)',
      },
      400
    );
  }

  if (fromDatabase && text) {
    return jsonResponse(
      {
        success: false,
        error: 'Cannot specify both "text" and "fromDatabase: true". Choose one mode.',
      },
      400
    );
  }

  if (!ALLOWED_TABLES.includes(table as typeof ALLOWED_TABLES[number])) {
    return jsonResponse(
      {
        success: false,
        error: `Invalid table. Allowed tables: ${ALLOWED_TABLES.join(', ')}`,
      },
      400
    );
  }

  if (!isValidUUID(id)) {
    return jsonResponse(
      {
        success: false,
        error: 'Invalid id format. Must be a valid UUID.',
      },
      400
    );
  }

  console.log(`[Embedding] Generating for ${table} #${id} (mode: ${fromDatabase ? 'database' : 'direct'})`);

  try {
    // Create Supabase client for database operations
    const supabase = createClient(
      env.SUPABASE_URL || env.VITE_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // SECURITY: Validate authorization ATOMICALLY with data fetch
    // This prevents TOCTOU race conditions where data could be modified between check and use
    const userSupabase = auth.supabase;
    const config = ENTITY_CONFIGS[table];
    
    if (!config) {
      return jsonResponse({
        success: false,
        error: `Unsupported table: ${table}`
      }, 400);
    }

    // Store pre-validated data to prevent race conditions
    let preValidatedData: DatabaseRecord | null = null;

    // Check admin privileges for admin-only entities
    if (config.requiresAdmin) {
      const adminAuth = await verifyAdminPrivileges(studentId, userSupabase);
      if (!adminAuth.authorized) {
        return jsonResponse({
          success: false,
          error: adminAuth.error
        }, 403);
      }
    } else {
      // Check entity ownership for user-owned entities ATOMICALLY with data fetch
      const ownershipAuth = await verifyEntityOwnership(table, id, studentId, userSupabase);
      if (!ownershipAuth.authorized) {
        return jsonResponse({
          success: false,
          error: ownershipAuth.error
        }, 403);
      }
      // Store the validated data to use later (prevents race condition)
      preValidatedData = ownershipAuth.data ?? null;
    }

    // Get the text (either provided or fetched from database)
    let finalText: string;
    
    if (fromDatabase) {
      // MODE 2: Fetch from database using shared text builders
      // Use pre-validated data when available to prevent race conditions
      console.log(`[Embedding] Fetching data from ${table} for ID ${id}`);
      finalText = await fetchAndBuildText(table, id, supabase, preValidatedData);
      console.log(`[Embedding] Built text from database (${finalText.length} chars)`);
    } else {
      // MODE 1: Use provided text
      if (!text || typeof text !== 'string' || text.trim().length < EMBEDDING_CONFIG.MIN_TEXT_LENGTH) {
        return jsonResponse(
          {
            success: false,
            error: `Text too short (minimum ${EMBEDDING_CONFIG.MIN_TEXT_LENGTH} characters)`,
          },
          400
        );
      }
      finalText = text;
      console.log(`[Embedding] Using provided text (${finalText.length} chars)`);
    }

    // Generate embedding using shared client
    const embedding = await callEmbeddingWorker(finalText, env);

    console.log(`[Embedding] Generated ${embedding.length}-dimensional vector`);

    // Update database if not skipped (after ownership validation)
    if (!skipDatabaseUpdate) {
      try {
        const result = await updateEmbedding(supabase, table, id, embedding);
        
        if (!result.success) {
          return jsonResponse({
            success: false,
            error: result.error || 'Database update failed',
          }, 500);
        }
      } catch (error) {
        if (error instanceof EmbeddingError) {
          return jsonResponse({
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
          }, 500);
        }
        throw error;
      }
    }

    // Return response
    if (returnEmbedding) {
      return jsonResponse({
        success: true,
        embedding,
        dimensions: embedding.length,
      });
    }

    return jsonResponse({
      success: true,
      message: `Embedding generated for ${table} #${id}`,
      dimensions: embedding.length,
      mode: fromDatabase ? 'database' : 'direct',
      textLength: finalText.length,
    });
  } catch (error) {
    console.error('[Embedding] Error:', error);
    
    // Handle EmbeddingError with proper status codes
    if (error instanceof EmbeddingError) {
      const statusCode = 
        error.code === 'AUTH_REQUIRED' ? 401 :
        error.code === 'RATE_LIMIT' ? 429 :
        error.code === 'INVALID_TEXT' || error.code === 'INSUFFICIENT_DATA' ? 400 :
        500;
      
      return jsonResponse(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        statusCode
      );
    }
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    return jsonResponse(
      {
        success: false,
        error: errorMessage,
      },
      500
    );
  }
}
