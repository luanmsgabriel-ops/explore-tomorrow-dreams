# Checkpoint — Etapa 6: fidelidade visual v2

## Objetivo

Aproximar ainda mais o Tomorrow Live da referência visual enviada, com foco em partículas douradas perceptíveis, planeta mais escuro no centro, halo concentrado na borda, mais órbitas e ondas traseiras com maior amplitude e profundidade.

## Base

- Repositório: `luanmsgabriel-ops/explore-tomorrow-dreams`
- Base do `main`: `cb10a4ca61d8a2ab659530e4327b58ddff0af990`
- Branch funcional: `stage-6-reference-fidelity-v2`
- PR funcional: `#23`
- SHA funcional mergeado: `aea32de377f55bf820984d1bcd91bde009fdf18f`
- Nenhuma dependência runtime nova.

## Implementação

### `liveGlobeEffects.ts`

- adicionada camada escura sobre o núcleo para aproximar o interior do planeta da referência;
- halo Fresnel passou de duas para três shells, incluindo uma borda mais fina e luminosa;
- partículas turquesa e douradas foram separadas em geometrias e materiais diferentes;
- dourado passou a representar aproximadamente 14% do halo e 17% do cinturão orbital;
- partículas douradas são maiores e mais luminosas que as de fundo para permanecerem visíveis;
- densidade das nuvens externas aumentada;
- órbitas aumentadas de quatro para seis, com dois anéis dourados;
- intensidade continua reagindo a `audioLevel`;
- `prefers-reduced-motion` continua preservado;
- recursos WebGL continuam com `dispose()` explícito.

### `LiveWaveBackdrop.tsx`

- amplitude aumentada em todos os estados para formar ondas realmente sinuosas;
- campo mantido em 12 linhas (7 em low performance), preservando os testes e o orçamento mobile;
- linhas divididas visualmente em três profundidades;
- senoide principal ganhou harmônicos e envelope lento para evitar aparência de faixa horizontal plana;
- glow separado do traço principal para maior profundidade;
- nós viajantes aumentados nas linhas principais;
- partículas douradas passaram a existir em todos os estados, não apenas em `Ofertas`;
- acentos dourados também percorrem as ondas;
- `audioLevel` e estados `Aguardando/Ouvindo/Pensando/Falando/Ofertas` continuam controlando intensidade e velocidade.

## Arquivos funcionais alterados

- `src/components/opportunities/live/LiveWaveBackdrop.tsx`
- `src/components/opportunities/live/liveGlobeEffects.ts`

Nenhum arquivo de Téo, WhatsApp, banco, Supabase, catálogo, calendário, comparação, Home, admin ou rotas foi alterado.

## Validação

Workflow temporário criado apenas na branch e removido antes do merge.

Run aprovado:

- GitHub Actions: `32507373471`
- testes focados: aprovado;
- TypeScript: aprovado;
- ESLint do escopo: aprovado;
- build Vite/PWA de produção: aprovado.

## Merge e sync

- PR `#23` squash-mergeado;
- SHA funcional em `main`: `aea32de377f55bf820984d1bcd91bde009fdf18f`;
- Lovable registrou o SHA como `completed`;
- preview foi reconstruído com screenshot prefixada por `id-preview-aea32de3`;
- produção não foi publicada por esta tarefa.

## Estado

- IMPLEMENTADO: sim
- TESTADO: sim
- MERGEADO: sim
- SINCRONIZADO NO LOVABLE: sim
- PUBLICADO: não
- VALIDADO VISUALMENTE: pendente de validação humana no preview

## Próxima ação

Abrir `/oportunidades/live` no preview e comparar diretamente com a referência, verificando principalmente:

1. partículas douradas perceptíveis sem dominar o turquesa;
2. centro do planeta mais escuro;
3. halo fino e forte na borda;
4. ondas traseiras claramente sinuosas e em profundidade;
5. órbitas adicionais;
6. comportamento dos estados `Ouvindo` e `Falando`;
7. mobile e `prefers-reduced-motion`.

Não iniciar voz real nem publicar antes dessa validação visual.
