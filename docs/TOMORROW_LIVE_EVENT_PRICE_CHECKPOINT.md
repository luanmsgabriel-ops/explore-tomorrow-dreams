# Checkpoint — Correção de preços de pacotes de evento

## Estado em 20/08/2026

- Escopo: corrigir preços principais incorretos em pacotes de evento do inventário `viajandocomdesconto`.
- Sintoma observado: ofertas de evento eram exibidas com `R$ 100,00` por pessoa, apesar de a fonte possuir opções totais muito superiores.
- Etapa 6: não iniciada.

## Causa raiz

No sincronizador `travel-offers-sync`, o fallback de preço utiliza `parseBrCurrency(origin.min_parcela)` e depois multiplica o resultado por 10.

Para uma string como `10x de R$ 240`, o parser existente lê o primeiro número (`10`) em vez do valor da parcela (`240`). O cálculo seguinte resulta em `10 * 10 = 100`, gravando um preço principal inválido.

## Auditoria do inventário

Inventário ativo `viajandocomdesconto`, `offer_type = pacote`:

- 981 pacotes comuns com preços de hotel: todos já coincidiam exatamente com o menor preço explícito da fonte;
- 43 pacotes de evento: todos estavam com `price_per_person = 100,00` e todos possuíam opções explícitas de preço em `raw_data.ingressos[].preco`;
- 21 grupos guiados: preços entre R$ 4.442,81 e R$ 39.691,00, sem o padrão artificial de R$ 100,00;
- após a correção, não há pacote ativo com preço abaixo de R$ 500,00.

Nos 43 eventos, o total de 10 parcelas corresponde ao menor preço explícito da opção, com diferença de apenas R$ 0,48 a R$ 9,80 por arredondamento. Portanto, o menor `ingressos[].preco` é o valor-fonte mais seguro para o preço principal do evento.

## Correção aplicada

Migration versionada:

`supabase/migrations/20260821012000_fix_event_package_prices.sql`

A migration:

- cria `public.normalize_viajando_event_package_price()`;
- cria o trigger `trg_normalize_viajando_event_package_price` em `public.travel_offers`;
- atua somente em registros `source = viajandocomdesconto`, `offer_type = pacote`, `source_entry = PACOTES`, categoria `Evento`, com array de opções de ingresso;
- usa somente o menor total explícito informado em `ingressos[].preco`;
- corrige `price_per_person` e o espelho interno `package_price_per_person`;
- não estima, soma ou inventa componentes de preço;
- não altera taxa, datas, origem, destino, disponibilidade ou inclusões.

O trigger está ativo e possui `search_path=pg_catalog, public` configurado explicitamente.

## Validação pós-correção

- eventos ativos: 43;
- eventos ainda com R$ 100,00: 0;
- divergências entre preço principal e menor opção explícita da fonte: 0;
- pacotes comuns com preço de hotel: 981;
- divergências nesses pacotes comuns: 0;
- pacotes ativos abaixo de R$ 500,00: 0.

Oferta usada como reprodução:

- ID: `07d9ff4a-bf9f-47f4-82aa-1f8c09e722ae`;
- preço incorreto anterior: R$ 100,00;
- preço principal corrigido: R$ 2.409,80;
- taxa por pessoa: R$ 119,00;
- total por pessoa após correção: R$ 2.528,80.

## Risco residual

O código atual de `travel-offers-sync` ainda contém o parser que interpreta incorretamente strings de parcelamento. O trigger no banco impede que esse valor incorreto seja persistido para o formato atual de pacotes de evento. Uma refatoração posterior do parser deve remover essa causa também na camada de ingestão, com testes unitários específicos para strings como `10x de R$ 240`.

## Próxima ação

1. Mergear a migration e este checkpoint no `main`.
2. Confirmar sincronização no Lovable.
3. Publicar o frontend somente se houver mudanças de frontend pendentes; a correção de dados já está ativa no banco.
4. Reabrir a oferta reproduzida e confirmar R$ 2.409,80 + taxa R$ 119,00.
5. Em seguida, corrigir o parser do sincronizador em mudança isolada com testes, sem alterar a semântica validada dos 981 pacotes comuns.
