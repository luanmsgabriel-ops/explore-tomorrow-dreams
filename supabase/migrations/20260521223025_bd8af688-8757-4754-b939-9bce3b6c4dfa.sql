UPDATE whatsapp_conversations
SET messages_history = messages_history
  || jsonb_build_array(
       jsonb_build_object('role','assistant','content','[ÁUDIO] Oi Anderson! Aqui é o Téo de novo. Só queria te falar que você também pode conversar comigo por áudio, viu? Se for mais prático pra você, manda áudio à vontade que eu te respondo. Ah, e antes que eu me esqueça: manda sua localização aqui pra eu te mostrar uma coisa massa que eu consigo fazer também!','timestamp', now()::text),
       jsonb_build_object('role','assistant','content','Antes que eu me esqueça, manda sua localização aqui pra eu te mostrar o que eu consigo fazer também 📍','timestamp', now()::text)
     ),
    updated_at = now()
WHERE phone_number = '555499725200';