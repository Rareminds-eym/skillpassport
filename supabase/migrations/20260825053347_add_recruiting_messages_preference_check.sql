-- Add recruitingMessages notification preference gating to the existing
-- create_message_notification() trigger function.
--
-- Behavior (matches Application Updates / New Opportunities preference semantics):
--   - notification_preferences->'recruitingMessages' = false  -> skip notification
--   - missing row / missing key / null / malformed value      -> notify (default ON)
--   - preference lookup or notification-build failure of any kind is caught and
--     logged via RAISE WARNING; the message insert itself is never blocked or
--     rolled back.
--
-- No table/column/index/constraint change. The existing trigger
-- (trigger_create_message_notification on public.messages) and its firing
-- conditions are unchanged; only the function body is replaced.

CREATE OR REPLACE FUNCTION public.create_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  v_sender_name text;
  v_notification_title text;
  v_notification_message text;
  v_recruiting_messages_pref jsonb;
begin
  -- Only create notification if receiver is a learner
  if new.receiver_type = 'learner' then
    begin
      -- Check the learner's recruitingMessages preference.
      -- Explicit false -> skip. Missing row/key/null/malformed -> notify (default ON).
      select notification_preferences -> 'recruitingMessages'
      into v_recruiting_messages_pref
      from user_settings
      where user_id = new.receiver_id;

      if v_recruiting_messages_pref is distinct from 'false'::jsonb then
        -- Get sender name based on sender_type
        if new.sender_type = 'recruiter' then
          select coalesce(name, email) into v_sender_name
          from recruiters
          where id = new.sender_id;
        elsif new.sender_type = 'educator' then
          select coalesce(first_name || ' ' || last_name, email) into v_sender_name
          from school_educators
          where id = new.sender_id;
        elsif new.sender_type = 'school_admin' then
          select coalesce("firstName" || ' ' || "lastName", email) into v_sender_name
          from users
          where id = new.sender_id;
        elsif new.sender_type = 'college_admin' then
          select coalesce("firstName" || ' ' || "lastName", email) into v_sender_name
          from users
          where id = new.sender_id;
        elsif new.sender_type = 'learner' then
          select coalesce(profile->>'name', email) into v_sender_name
          from learners
          where id = new.sender_id;
        end if;

        v_sender_name := coalesce(v_sender_name, 'Someone');
        v_notification_title := 'New message from ' || v_sender_name;
        v_notification_message := substring(new.message_text from 1 for 100);

        insert into notifications (
          recipient_id,
          type,
          title,
          message,
          read
        ) values (
          new.receiver_id,
          'new_message',
          v_notification_title,
          v_notification_message,
          false
        );
      end if;
    exception when others then
      raise warning 'create_message_notification: notification skipped for message to % due to error: %', new.receiver_id, sqlerrm;
    end;
  end if;

  return new;
end;
$function$;
