# Tomorrow Live — Etapa 7: pronúncia brasileira no Realtime

Data: 2026-08-21  
Branch: `stage-7-voice-pt-br`  
Base confirmada: `4968ed7c8eb011ed9ba2a11a1464bae13f8c9f0f`

## Problema

A voz masculina `cedar` estava funcional, mas o usuário percebeu pronúncia e cadência próximas do português de Portugal. O texto gerado permanecia em português; a divergência estava na apresentação vocal.

## Diagnóstico

A voz selecionada controla o timbre, mas não fixa sozinha a variante regional. A configuração anterior orientava apenas “português do Brasil”, sem especificar pronúncia, ritmo, entonação, vocabulário ou a exclusão explícita do português europeu.

## Mudança mínima

A instrução da sessão Realtime agora determina:

- português brasileiro `pt-BR` exclusivamente;
- pronúncia, ritmo, entonação e vocabulário naturais do Brasil;
- sotaque brasileiro neutro;
- ausência de pronúncia, cadência, vocabulário e construções do português europeu.

## Escopo preservado

- voz `cedar` mantida;
- modelo `gpt-realtime-2.1` mantido;
- transcrição, VAD, interrupção e WebRTC mantidos;
- nenhuma mudança no frontend;
- nenhum fluxo de inventário, cotação, WhatsApp ou ferramenta alterado;
- nenhuma credencial adicionada ou exposta.

## Arquivos alterados

- `supabase/functions/tomorrow-live-realtime-session/core.ts`
- `supabase/functions/tomorrow-live-realtime-session/index_test.ts`
- `docs/TOMORROW_LIVE_MASTER_PLAN.md`
- `docs/TOMORROW_LIVE_STAGE_7_VOICE_PT_BR.md`

## Referência oficial OpenAI

- A Realtime API usa a voz selecionada para o timbre e recomenda `cedar` ou `marin` para qualidade.
- O guia oficial recomenda instruções explícitas para idioma, personalidade, tom e sotaque, com testes incrementais.

## Estado

- IMPLEMENTADO: sim.
- TESTADO: sim; validação local aprovada e GitHub Actions `32519810390` aprovou testes Deno, TypeScript, ESLint e build.
- MERGEADO: sim; PR `#33`, SHA funcional `5a81b02130b3356dc39f52af9c02f4b756753425`.
- SINCRONIZADO NO LOVABLE: sim; o Lovable reconheceu o mesmo SHA e ficou `ready`.
- EDGE FUNCTION REIMPLANTADA: não.
- PUBLICADO: a versão anterior está publicada; esta correção server-side ainda não.
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Reimplantar manualmente somente `tomorrow-live-realtime-session` no backend Lovable Cloud e testar em uma sessão nova. Não é necessário republicar o frontend.
