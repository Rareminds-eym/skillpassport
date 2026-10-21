CREATE TABLE public.lte_review_email_deliveries (
 event_id uuid PRIMARY KEY REFERENCES public.lte_review_events(event_id) ON DELETE CASCADE,
 recipient_id uuid NOT NULL REFERENCES public.users(id),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','uncertain','skipped')),
 started_at timestamptz,
 completed_at timestamptz,
 provider_message_id text
);
ALTER TABLE public.lte_review_email_deliveries DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lte_review_email_deliveries FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.lte_review_email_deliveries TO service_role;

CREATE FUNCTION public.claim_lte_review_email(p_event_id uuid) RETURNS jsonb
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE delivery public.lte_review_email_deliveries; event public.lte_review_events;
BEGIN
 SELECT * INTO delivery FROM public.lte_review_email_deliveries WHERE event_id=p_event_id FOR UPDATE;
 IF NOT FOUND OR delivery.status IN ('sent','skipped') THEN RETURN NULL; END IF;
 IF delivery.status='sending' AND delivery.started_at>now()-interval '2 minutes' THEN RAISE EXCEPTION 'EMAIL_IN_PROGRESS'; END IF;
 IF delivery.status IN ('sending','uncertain') THEN
  UPDATE public.lte_review_email_deliveries SET status='uncertain' WHERE event_id=p_event_id;
  RETURN jsonb_build_object('status','uncertain','eventId',p_event_id);
 END IF;
 SELECT * INTO event FROM public.lte_review_events WHERE event_id=p_event_id;
 -- Suppress delayed assignment/reminder mail after a newer outcome arrived.
 IF event.event_type<>'lte.review_completed' AND EXISTS(SELECT 1 FROM public.lte_review_events e WHERE e.review_id=event.review_id AND
  (e.assignment_version>event.assignment_version OR e.event_type='lte.review_completed')) THEN
  UPDATE public.lte_review_email_deliveries SET status='skipped',completed_at=now() WHERE event_id=p_event_id;
  RETURN NULL;
 END IF;
 UPDATE public.lte_review_email_deliveries SET status='sending',started_at=now() WHERE event_id=p_event_id;
 RETURN jsonb_build_object('status','sending','eventId',p_event_id,'recipientId',delivery.recipient_id,'type',event.event_type,'decision',event.payload->>'decision');
END $$;
REVOKE ALL ON FUNCTION public.claim_lte_review_email(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_lte_review_email(uuid) TO service_role;
