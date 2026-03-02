-- Fix educator sender name lookup in message notifications
-- This migration updates the create_message_notification trigger function
-- to support both school_educators.id and school_educators.user_id mappings

CREATE OR REPLACE FUNCTION "public"."create_message_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_sender_name text;
  v_notification_title text;
  v_notification_message text;
begin
  -- Only create notification if receiver is a student
  if new.receiver_type = 'student' then
    -- Get sender name based on sender_type
    if new.sender_type = 'recruiter' then
      -- Fix: Use correct column names for recruiters table
      select coalesce(name, email) into v_sender_name
      from recruiters
      where id = new.sender_id;
    elsif new.sender_type = 'educator' then
      -- Fixed: Support both id and user_id mappings for educator lookup
      select coalesce(first_name || ' ' || last_name, email) into v_sender_name
      from school_educators
      where id = new.sender_id OR user_id = new.sender_id;
    elsif new.sender_type = 'school_admin' then
      select coalesce("firstName" || ' ' || "lastName", email) into v_sender_name
      from users
      where id = new.sender_id;
    elsif new.sender_type = 'college_admin' then
      select coalesce("firstName" || ' ' || "lastName", email) into v_sender_name
      from users
      where id = new.sender_id;
    elsif new.sender_type = 'student' then
      select coalesce(profile->>'name', email) into v_sender_name
      from students
      where id = new.sender_id;
    end if;

    v_sender_name := coalesce(v_sender_name, 'Someone');
    v_notification_title := 'New message from ' || v_sender_name;
    v_notification_message := substring(new.message_text from 1 for 100);

    -- Create notification for the student
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

  return new;
end;
$$;
