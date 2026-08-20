# Checkpoint — Etapa 5

## Estado em 20/08/2026

- Etapa 5 — Calendário inteligente: implementada e validada em preview.
- Publicação em produção: pendente.
- SHA publicado nesta etapa: N/A.
- Deployment ID: N/A.
- Etapa 6: não iniciada.

## Validações registradas

- Security View informada após correção da view analítica: Critical 0, High 0, Moderate 0, Low 5.
- 29 testes Vitest aprovados.
- Typecheck aprovado.
- Build de produção aprovado.
- `/oportunidades` redireciona para `/oportunidades/catalogo`.
- `/oportunidades/calendario` implementado e validado em preview com inventário real.
- Comparação limitada a 3 ofertas.
- Responsividade validada em preview para desktop 1280 e mobile 390.

## Integridade

Foi detectada uma alteração indevida em `src/pages/Index.tsx` que colocou texto operacional na landing page. A Home deve permanecer com o conteúdo comercial anterior. A correção está sendo feita pelo GitHub sem modificar a Etapa 5.

O checkpoint anterior marcava incorretamente a etapa como publicada sem existir Deployment ID. Este documento corrige esse registro.

## Próxima ação

1. Restaurar a Home comercial original via GitHub.
2. Confirmar sincronização do HEAD no Lovable.
3. Tentar publicação pelo mecanismo real de deploy, sem bypass.
4. Se houver bloqueio, registrar a mensagem exata.
5. Somente após existir Deployment ID e validação no domínio principal marcar a Etapa 5 como publicada e concluída.

## Status

Etapa 5: IMPLEMENTADA / VALIDADA EM PREVIEW / PUBLICAÇÃO PENDENTE.

Etapa 6: NÃO INICIADA.
