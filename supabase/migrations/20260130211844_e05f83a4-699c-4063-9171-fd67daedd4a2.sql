-- CORRIGIR TABELA SALES - Esta tabela ainda usa has_role() antigo

-- Remover política existente
DROP POLICY IF EXISTS "Admins can manage all sales" ON public.sales;

-- Criar políticas separadas usando is_admin() otimizado
CREATE POLICY "Admins can view sales" 
ON public.sales FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can insert sales" 
ON public.sales FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update sales" 
ON public.sales FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete sales" 
ON public.sales FOR DELETE 
TO authenticated
USING (is_admin());