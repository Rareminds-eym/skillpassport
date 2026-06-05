ALTER SERVER sso_worker_server
OPTIONS (
  SET host 'host.docker.internal',
  SET port '54332'
);