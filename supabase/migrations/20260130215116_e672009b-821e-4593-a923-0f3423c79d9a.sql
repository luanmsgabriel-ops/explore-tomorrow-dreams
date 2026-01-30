-- CORREÇÃO DEFINITIVA: Remover TODAS as políticas de user_roles e manter apenas SELECT simples

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- ÚNICA política necessária: cada usuário pode ver sua própria role
-- Isso é suficiente para is_admin() funcionar (que é SECURITY DEFINER)
CREATE POLICY "Users can view own role" 
ON public.user_roles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Admins gerenciam roles via função SECURITY DEFINER (não via RLS)
-- Criar função para admin adicionar roles (bypass RLS)
CREATE OR REPLACE FUNCTION public.admin_add_role(target_user_id uuid, target_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can add roles';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Função para admin remover roles (bypass RLS)
CREATE OR REPLACE FUNCTION public.admin_remove_role(target_user_id uuid, target_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;
  
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = target_role;
END;
$$;