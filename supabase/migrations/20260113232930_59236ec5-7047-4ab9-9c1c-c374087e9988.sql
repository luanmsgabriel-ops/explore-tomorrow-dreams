-- Remove a coluna legacy 'role' da tabela profiles
-- Os papéis dos usuários devem estar na tabela user_roles

ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;