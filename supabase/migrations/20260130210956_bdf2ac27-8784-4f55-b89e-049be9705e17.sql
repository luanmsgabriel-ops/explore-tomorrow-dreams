-- SOLUÇÃO DEFINITIVA: Remover todas as políticas problemáticas e criar novas ultra-leves
-- O problema: has_role() é executado para CADA ROW mesmo com auth.uid() IS NOT NULL

-- 1. Recriar a função has_role usando SQL puro (mais rápido que plpgsql)
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

-- 2. Criar função auxiliar ultra-leve para verificar se é admin (cached por sessão)
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

-- 3. Recriar políticas da quote_requests usando a nova função
DROP POLICY IF EXISTS "Only admins can view quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admins can update quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admins can delete quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;

CREATE POLICY "Public can insert quotes" 
ON public.quote_requests FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view quotes" 
ON public.quote_requests FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update quotes" 
ON public.quote_requests FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete quotes" 
ON public.quote_requests FOR DELETE 
TO authenticated
USING (is_admin());

-- 4. Recriar políticas da ai_itineraries
DROP POLICY IF EXISTS "Only admins can view itineraries" ON public.ai_itineraries;
DROP POLICY IF EXISTS "Admins can update itineraries" ON public.ai_itineraries;
DROP POLICY IF EXISTS "Admins can delete itineraries" ON public.ai_itineraries;
DROP POLICY IF EXISTS "Anyone can create itineraries" ON public.ai_itineraries;

CREATE POLICY "Public can insert itineraries" 
ON public.ai_itineraries FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view itineraries" 
ON public.ai_itineraries FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update itineraries" 
ON public.ai_itineraries FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete itineraries" 
ON public.ai_itineraries FOR DELETE 
TO authenticated
USING (is_admin());

-- 5. Recriar políticas da ai_generated_images
DROP POLICY IF EXISTS "Only admins can view generated images" ON public.ai_generated_images;
DROP POLICY IF EXISTS "Admins can update generated images" ON public.ai_generated_images;
DROP POLICY IF EXISTS "Admins can delete generated images" ON public.ai_generated_images;
DROP POLICY IF EXISTS "Anyone can create generated images" ON public.ai_generated_images;

CREATE POLICY "Public can insert images" 
ON public.ai_generated_images FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view images" 
ON public.ai_generated_images FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update images" 
ON public.ai_generated_images FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete images" 
ON public.ai_generated_images FOR DELETE 
TO authenticated
USING (is_admin());

-- 6. Recriar políticas da profiles para admin
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins manage profiles" 
ON public.profiles FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 7. Recriar políticas da client_trips para admin
DROP POLICY IF EXISTS "Admins can manage all trips" ON public.client_trips;

CREATE POLICY "Admins manage all trips" 
ON public.client_trips FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 8. Criar índice na tabela user_roles se não existir (para acelerar is_admin())
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);