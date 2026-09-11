# Tomorrow Travel — refinamento do Hero da Home

Data: 2026-09-11

## Estado atual

O refinamento anterior do Hero já foi incorporado à `main` pelos PRs `#101` e `#102`. Após nova revisão visual no mobile, o usuário pediu que o vídeo do Hero seja exibido sem blur e sem qualquer camada global cobrindo a imagem.

Base verificada antes desta intervenção:

- `main`: `8c67174653368ee0acc83bec8b7b7a78da1c6445`;
- branch desta correção: `fix/home-hero-uncovered-video`;
- não havia PR aberto da Home no início desta intervenção;
- commits posteriores ao antigo checkpoint `8bd1a7a91d4511e9cef5a9ffeec1862eef4db741` foram revisados antes da alteração.

## Escopo desta correção

- preservar os vídeos responsivos atuais do Radar Tomorrow;
- remover o overlay `bg-black/10` do componente de fundo;
- remover o gradiente vertical global aplicado sobre todo o Hero;
- remover o gradiente radial global aplicado sobre todo o Hero;
- manter o vídeo sem `filter`, `blur` ou alteração de velocidade;
- preservar textos, indicadores reais, CTAs, Téo, WhatsApp, banco e Edge Functions.

## Arquivos funcionais alterados

- `src/components/landing/HeroCinematicBackground.tsx`;
- `src/components/landing/OpportunityHero.tsx`.

## Resultado técnico

O vídeo continua ocupando todo o Hero com `object-cover`, mas agora não possui nenhuma camada visual global entre o arquivo de vídeo e o conteúdo da interface. O poster responsivo permanece como fallback e o comportamento de `prefers-reduced-motion` continua preservado.

## Validação executada

Foi criado um workflow temporário exclusivamente para validar a branch e removido após a execução, antes do PR.

Run GitHub Actions: `34610827643` — concluído com sucesso.

- instalação de dependências: aprovada;
- TypeScript (`npx tsc --noEmit`): aprovado;
- ESLint dos dois componentes alterados: aprovado;
- testes focados da Home (`HomeNavigation` e `HomeInventoryPulse`): aprovados;
- build de produção (`npm run build`): aprovado;
- workflow temporário removido da branch após a validação.

## Segurança e integridade

- nenhuma alteração em dados comerciais;
- nenhum acesso direto a `travel_offers`;
- nenhum uso de `raw_data` ou `source_url`;
- nenhuma alteração em Téo, WhatsApp, autenticação, Supabase ou Edge Functions;
- nenhuma publicação automática.

## Estados separados

- IMPLEMENTADO: sim, na branch `fix/home-hero-uncovered-video`;
- TESTADO: sim;
- MERGEADO: não;
- SINCRONIZADO NO LOVABLE: não;
- PUBLICADO: não;
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Abrir PR contra `main`, revisar o diff e o preview visual mobile/desktop e somente depois decidir sobre merge e publicação.
