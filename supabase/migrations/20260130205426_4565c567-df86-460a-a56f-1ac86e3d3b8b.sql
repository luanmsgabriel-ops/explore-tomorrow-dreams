-- Remover políticas SELECT de admin que estão causando chamadas desnecessárias a has_role()
-- Para a lógica de negócio: admins podem ver destinos através da política pública (is_active=true)
-- Se precisarem ver inativos, isso deve ser feito via service role no backend

-- Destinations - remover SELECT admin
DROP POLICY IF EXISTS "Admins can view all destinations" ON public.destinations;

-- Promotional offers - remover SELECT admin
DROP POLICY IF EXISTS "Admins can view all offers" ON public.promotional_offers;

-- Garantir que admins possam fazer SELECT através de uma política mais inteligente
-- que NÃO chame has_role() para usuários anônimos

-- Abordagem alternativa: usar OR com verificação de role apenas se autenticado
-- Isso evita chamadas desnecessárias quando não há usuário logado

-- Recriar política SELECT para destinations que permita:
-- 1. Qualquer um ver destinos ativos
-- 2. Admins ver TODOS (incluindo inativos)
DROP POLICY IF EXISTS "Anyone can view active destinations" ON public.destinations;

CREATE POLICY "View destinations based on role" 
ON public.destinations 
FOR SELECT 
USING (
  is_active = true 
  OR 
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role))
);

-- Fazer o mesmo para promotional_offers
DROP POLICY IF EXISTS "Anyone can view active offers within validity" ON public.promotional_offers;

CREATE POLICY "View offers based on role" 
ON public.promotional_offers 
FOR SELECT 
USING (
  (is_active = true AND now() >= valid_from AND now() <= valid_until)
  OR 
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role))
);