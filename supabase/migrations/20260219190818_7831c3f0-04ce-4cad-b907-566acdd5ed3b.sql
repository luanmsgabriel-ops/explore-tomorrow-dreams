
-- Remover trigger antigo que chamava URL do Manus diretamente
DROP TRIGGER IF EXISTS trg_manus_webhook_single ON travel_quote_requests;
DROP TRIGGER IF EXISTS on_new_quote_trigger ON travel_quote_requests;

-- Criar/atualizar função que chama a Edge Function process-quote
CREATE OR REPLACE FUNCTION public.trigger_process_quote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  edge_function_url TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
  request_id bigint;
BEGIN
  -- Construir URL da Edge Function
  supabase_url := current_setting('app.settings.supabase_url', true);
  IF supabase_url IS NULL THEN
    supabase_url := 'https://wimdgvdpefkmjzzsklnt.supabase.co';
  END IF;
  
  edge_function_url := supabase_url || '/functions/v1/process-quote';
  
  -- Obter service role key
  service_role_key := current_setting('app.settings.service_role_key', true);
  IF service_role_key IS NULL THEN
    -- Fallback: usar a secret do vault
    SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
    LIMIT 1;
  END IF;

  RAISE LOG '[PROCESS-QUOTE] Trigger fired for quote %, calling Edge Function', NEW.id;

  -- Chamar Edge Function via pg_net
  SELECT net.http_post(
    url := edge_function_url,
    body := jsonb_build_object('record', to_jsonb(NEW)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    )
  ) INTO request_id;

  RAISE LOG '[PROCESS-QUOTE] Edge Function called, request_id=%', request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[PROCESS-QUOTE] Failed to call Edge Function: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Criar trigger para novas cotações pendentes
CREATE TRIGGER on_new_quote_trigger
  AFTER INSERT ON travel_quote_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION trigger_process_quote();
