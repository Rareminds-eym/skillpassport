SELECT
  foreign_table_schema,
  foreign_table_name
FROM information_schema.foreign_tables
ORDER BY 1,2;