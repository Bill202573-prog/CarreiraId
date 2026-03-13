
-- Fix Guilherme Andrade Nogueira's perfil that already has synced data
UPDATE perfil_atleta 
SET atleta_id_vinculado = true, atleta_id_sync_at = now()
WHERE crianca_id = '0ef4ffc1-c648-429d-a4e4-9a0106e337db'
AND atleta_id_vinculado = false;
