SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'career_rag_document',
    'career_rag_pending',
    'career_rag_store',
    'career_rag_search',
    'career_rag_verify',
    'career_rag_invalidate_vector_metadata'
  )
ORDER BY p.proname;