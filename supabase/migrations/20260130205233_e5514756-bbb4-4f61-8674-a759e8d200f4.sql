-- Corrigir políticas RLS da tabela destinations
-- O problema é que a política "Admins can manage destinations" usa ALL
-- e é PERMISSIVE, então has_role() é chamado para cada SELECT também

-- Remover política ALL do admin
DROP POLICY IF EXISTS "Admins can manage destinations" ON public.destinations;

-- Criar políticas específicas para cada operação admin
CREATE POLICY "Admins can insert destinations" 
ON public.destinations 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update destinations" 
ON public.destinations 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete destinations" 
ON public.destinations 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir admins visualizar TODOS os destinos (incluindo inativos)
CREATE POLICY "Admins can view all destinations" 
ON public.destinations 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Agora fazer o mesmo para outras tabelas com problemas similares

-- promotional_offers
DROP POLICY IF EXISTS "Admins can manage all offers" ON public.promotional_offers;

CREATE POLICY "Admins can insert offers" 
ON public.promotional_offers 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update offers" 
ON public.promotional_offers 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete offers" 
ON public.promotional_offers 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all offers" 
ON public.promotional_offers 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));