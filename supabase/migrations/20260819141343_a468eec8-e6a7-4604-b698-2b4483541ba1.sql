SELECT cron.schedule('whatsapp-message-dedup-cleanup', '0 * * * *', $$
  DELETE FROM public.whatsapp_processed_messages WHERE created_at < now() - interval '24 hours';
$$);