-- DIDAC 2026 Dynamic Promo Code Management — atomic dedup guard for the
-- promo-rejection email notification (TSD v2.1).
-- No new table: this is a single-column flag on the existing users.metadata
-- jsonb, set atomically so the notification is sent at most once per user,
-- including under retries of the fire-and-forget withAuth() hook.
BEGIN;

CREATE OR REPLACE FUNCTION "public"."mark_promo_rejection_notified"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_updated uuid;
BEGIN
  -- Single atomic UPDATE...WHERE: only succeeds (returns a row) the FIRST
  -- time for a given user. A second/retried call for the same user finds
  -- the flag already true and updates nothing — this is what makes the
  -- notification exactly-once without a separate reservation table, and
  -- without the read-then-write race a plain SELECT-then-UPDATE would have.
  UPDATE users
    SET metadata = metadata || jsonb_build_object('promo_notification_sent', true)
    WHERE id = p_user_id
      AND coalesce((metadata->>'promo_notification_sent')::boolean, false) = false
    RETURNING id INTO v_updated;
  RETURN v_updated IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION "public"."mark_promo_rejection_notified"("uuid") IS
  'Atomically marks that the DIDAC promo-rejection email has been sent for this '
  'user, returning true only on the first call (false on every subsequent call) — '
  'the caller should send the email only when this returns true. Matches the '
  'exactly-once requirement in TSD v2.1 without a dedicated reservation table.';

REVOKE ALL ON FUNCTION "public"."mark_promo_rejection_notified"("uuid") FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."mark_promo_rejection_notified"("uuid") TO "service_role";

NOTIFY pgrst,'reload schema';
COMMIT;
