
-- Backfill: register Gabriel's invite from Pedro and auto-connect them
-- This will trigger handle_convite_confirmado which credits XP to Pedro

INSERT INTO public.rede_convites (convidante_perfil_id, convidado_user_id)
VALUES ('d91d097e-372a-40f0-ae64-45cf44e5b38d', 'b63b00bf-9391-4cb6-ac23-57b3f761c161');

-- Auto-connect them with status 'aceita'
INSERT INTO public.rede_conexoes (solicitante_id, destinatario_id, status)
VALUES ('67b0640e-1737-4fea-b816-f2d830121e01', 'b63b00bf-9391-4cb6-ac23-57b3f761c161', 'aceita')
ON CONFLICT DO NOTHING;
