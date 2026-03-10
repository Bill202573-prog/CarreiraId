-- Fix missing connection for Antonio Carlos (invited by Pedro)
-- Antonio = 09f21590, Pedro = 67b0640e
INSERT INTO rede_conexoes (solicitante_id, destinatario_id, status)
VALUES ('09f21590-59d2-4979-ac84-4a796ceaedb1', '67b0640e-1737-4fea-b816-f2d830121e01', 'aceita')
ON CONFLICT DO NOTHING;