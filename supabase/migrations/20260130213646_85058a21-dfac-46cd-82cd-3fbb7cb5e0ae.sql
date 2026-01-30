-- CORREÇÃO DEFINITIVA: Simplificar RLS de user_roles para evitar recursão

-- Remover políticas existentes de user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Criar política simples de SELECT que não causa recursão
-- Cada usuário pode ver sua própria role (necessário para is_admin() funcionar)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- Admins podem gerenciar roles (usando is_admin que é SECURITY DEFINER)
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL 
TO authenticated
USING (is_admin());

-- Garantir que a função is_admin() é STABLE e SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Também garantir que has_role é STABLE e SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Garantir índice para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);