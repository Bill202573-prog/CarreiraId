
-- Delete test profiles and their associated criancas
-- Profiles: Ronaldo Cesar Filho (x2), Vinicius Salles, Frederico Almeida Alves,
-- Julio Cesar Rodrigues, Guilherme Andrade Nogueira, Antonio Carlos Silva Valente,
-- Gabriel Costa Ferreira, Nicolas dos Santos Pereira, Aquele

DELETE FROM perfil_atleta WHERE id IN (
  'b8c05eb2-389e-419b-a924-f50490e362c4', -- Ronaldo Cesar Filho 41m6
  '5a22ad89-fb7d-4863-b64f-7d6bd88a7ec2', -- Ronaldo Cesar Filho qysx
  '767ffc8d-bd8b-47e8-bb4c-dd6249b0bec8', -- Vinicius Salles
  '55eaa17f-38b7-4ae5-9c3f-98387e5a0ba7', -- Frederico Almeida Alves
  'eb9b0770-6241-46b3-8ebf-8c864f65c4fd', -- Julio Cesar Rodrigues
  '659d70d2-ba5a-468d-b2e6-98a08f8069af', -- Guilherme Andrade Nogueira
  '8168a64a-3db4-40b6-9e53-0e104776f1ff', -- Antonio Carlos Silva Valente
  '389cebe1-35b4-446f-8adf-7a19e7b0ce21', -- Gabriel Costa Ferreira
  '60edc90e-d979-4369-be94-ef10cd10ed00', -- Nicolas dos Santos Pereira
  'e0bb8114-6733-430b-bd06-0ba8c8fd9afe'  -- Aquele
);

-- Delete orphaned criancas
DELETE FROM criancas WHERE id IN (
  '5ffe834a-c91e-4da6-b063-c55eeaccdec8',
  'ba69a77f-2ae3-42ef-a539-2ff89339eb1f',
  'c84405c6-7561-4d24-bb27-fd881d4eafd7',
  'a9bc1f81-8487-49ad-81a1-5b58e4af2dcf',
  'b335d210-3116-4aed-8640-fcc9cbcfd19d',
  '0ef4ffc1-c648-429d-a4e4-9a0106e337db',
  '20efe692-8145-45d2-a120-37f950482a6b',
  'd55cb3ec-5581-4416-bda4-a9e83b6e2690',
  '614857d1-6a5d-40f6-835f-b3267090d6ee',
  '66dd7b24-81fe-4688-8872-4c0d4102e289'
);
