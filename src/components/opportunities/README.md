# Design system Tomorrow Live

Componentes isolados para as futuras rotas `/oportunidades`. Nenhum componente consulta banco, registra rota ou altera o fluxo atual do site.

## Uso

Envolva a experiência com `opportunities-theme` para aplicar o fundo e os tokens. Os componentes também carregam um escopo mínimo próprio para funcionar em modais ou testes isolados.

```tsx
import {
  OpportunityBadge,
  OpportunityButton,
  OpportunityCard,
  OpportunityField,
  OpportunityHeader,
  OpportunityState,
} from "@/components/opportunities";
```

## Contrato visual

- `OpportunityHeader`: cabeçalho e navegação responsiva, com estado ativo, menu móvel, fechamento por `Escape` e CTA opcional.
- `OpportunityButton`: variantes dourada, turquesa, contorno e neutra; altura mínima de toque de 44 px.
- `OpportunityField`: label obrigatório, orientação, erro, ícone e relações ARIA automáticas.
- `OpportunityBadge`: variantes para bloqueio, pacote, evento, parque, grupo guiado, últimos assentos e prazo.
- `OpportunityCard`: composição para bloqueio ou pacote, com preço por pessoa, taxa, datas, vagas e aéreo conforme dados recebidos.
- `OpportunityState`: carregamento, vazio e erro com anúncio acessível.

## Fidelidade dos dados

- `availableSeats: null` não publica quantidade de vagas.
- `airfareIncluded: false` exibe que o aéreo não está incluído.
- preço ausente usa apenas um travessão visual, sem valor ou texto inventado.
- badges comerciais e de urgência são recebidos por propriedade; o design system não cria regras de estoque ou prazo.
- a imagem só é exibida quando existe uma URL pública recebida pelo componente.

## Acessibilidade

- foco visível com contraste AA;
- navegação e ações utilizáveis por teclado;
- regiões de estado possuem `status` ou `alert` conforme a severidade;
- animações e transições são reduzidas por `prefers-reduced-motion`;
- elevação no hover só é aplicada em dispositivos com ponteiro preciso.
