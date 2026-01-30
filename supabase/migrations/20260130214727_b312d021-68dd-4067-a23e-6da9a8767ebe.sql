-- CORREÇÃO FINAL: Remover política recursiva de user_roles

-- Remover a política problemática que causa recursão
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Criar políticas específicas SEM usar is_admin() para evitar recursão
-- Admin INSERT: apenas admins existentes podem adicionar roles
CREATE POLICY "Admins can insert roles" 
ON public.user_roles FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Admin UPDATE: apenas admins podem atualizar roles
CREATE POLICY "Admins can update roles" 
ON public.user_roles FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Admin DELETE: apenas admins podem deletar roles
CREATE POLICY "Admins can delete roles" 
ON public.user_roles FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Admins podem ver todas as roles (usando subquery direta, não função)
CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);