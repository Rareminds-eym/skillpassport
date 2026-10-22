-- Replay protection for POST /api/internal/evidence.
--
-- The AI worker signs each evidence request with a nonce. The endpoint
-- claims the nonce here before reading any evidence, so one signed request
-- can be served at most once. The primary key is the nonce itself: a replay
-- fails the insert with 23505 and is refused.
--
-- Only the server-side service role touches this table (the endpoint uses
-- the admin client). RLS is enabled with no policies, so no other role can
-- read or write it.

create table if not exists public.internal_evidence_nonces (
  nonce text primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.internal_evidence_nonces enable row level security;

-- Retention sweep support: expired nonces may be deleted in bounded batches.
create index if not exists internal_evidence_nonces_expires_at_idx
  on public.internal_evidence_nonces (expires_at);
