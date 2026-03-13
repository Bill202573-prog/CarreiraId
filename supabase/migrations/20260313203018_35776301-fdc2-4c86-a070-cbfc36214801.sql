UPDATE public.carreira_assinaturas SET metodo_pagamento = 'cartao_credito' WHERE id = '51631e84-a8e0-478b-83d8-f54b5be01d3b';

INSERT INTO public.carreira_assinaturas (user_id, crianca_id, plano, status, metodo_pagamento, valor, inicio_em)
SELECT '6eb72aec-670b-40c4-99fa-4efa7658d4f4', 'd847a8c6-8eeb-4a25-863f-eb7fd60be0fb', 'competidor', 'ativa', 'pix', 17.90, now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.carreira_assinaturas 
  WHERE user_id = '6eb72aec-670b-40c4-99fa-4efa7658d4f4' 
  AND crianca_id = 'd847a8c6-8eeb-4a25-863f-eb7fd60be0fb' 
  AND status = 'ativa'
);