SELECT srvname, srvoptions 
FROM pg_foreign_server 
WHERE srvname = 'sso_worker_server';
