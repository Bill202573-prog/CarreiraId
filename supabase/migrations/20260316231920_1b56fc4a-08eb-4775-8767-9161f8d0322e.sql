
-- Delete perfil_atleta records for Lucas Martins test profiles
DELETE FROM perfil_atleta WHERE user_id = 'd600d721-6ef2-4da3-b504-d0b14201689f' AND nome = 'Lucas Martins';

-- Delete orphaned criancas records
DELETE FROM criancas WHERE id IN (
  '3936cc93-c972-4674-ba12-ab25dabf066e',
  '0e218cb1-e147-4587-a07b-c8528aac44a7',
  'ce164fee-6c76-4c0d-a575-d20e0c0fae44',
  'f01ba1e8-717b-4543-9d37-451877cc20ec',
  '80ab6865-3627-4433-bc51-22f4d2173481',
  'abec5c0d-b160-4f53-baeb-d41621eab882',
  'd110fdea-19ae-49ee-b96b-500091f70c7e',
  '6e6f9265-b097-4af3-bbfb-90152ee7c705'
);
