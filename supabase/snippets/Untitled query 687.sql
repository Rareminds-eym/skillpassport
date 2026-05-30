ALTER SERVER sso_worker_server
OPTIONS (
  SET host 'supabase_db_sso-auth',
  SET port '5432'
);