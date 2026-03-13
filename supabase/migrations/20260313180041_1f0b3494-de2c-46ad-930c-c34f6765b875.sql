-- Insert test subscriptions for athletes
INSERT INTO carreira_assinaturas (user_id, crianca_id, plano, status, valor, inicio_em, expira_em)
VALUES 
  ('991db7fc-1744-4933-8d07-024799b2dd3b', 'ed3e3083-7455-452d-b7ac-6734c191adf4', 'elite', 'ativa', 29.90, now(), now() + interval '1 year'),
  ('67b0640e-1737-4fea-b816-f2d830121e01', 'f9e860c9-f12c-4a1d-ac92-325bbdea0ff4', 'competidor', 'ativa', 15.90, now(), now() + interval '1 year');