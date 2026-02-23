

# Reposicionar a Tomorrow Travel: Acessibilidade + Tecnologia de IA Pioneira

## Resumo
Remover toda linguagem de "premium", "curadoria", "exclusivo" e "selecionado" do site e dos prompts do backend, substituindo por uma narrativa focada em **acessibilidade para todos os perfis de cliente** e no **diferencial tecnologico de ser o primeiro agente de IA B2C do mundo no setor de viagens**.

---

## Alteracoes no Frontend

### 1. `src/pages/Index.tsx`
- **Linha 39**: "Curadoria de destinos unicos para viajantes que buscam experiencias autenticas e inesqueciveis" -> "Tecnologia de ponta para facilitar sua viagem. O primeiro agente de IA do mundo no setor de viagens, acessivel para todos."
- **Linha 165**: "Curadoria Premium" -> "IA Pioneira no Turismo"
- **Linhas 166-168**: "Destinos selecionados por especialistas para experiencias unicas." -> "O primeiro agente de IA B2C do mundo no setor de viagens, tornando sua viagem dos sonhos mais facil e acessivel."
- **Linha 187**: "...roteiros sob medida para voce... plano de viagem exclusivo em segundos." -> "...roteiros sob medida para voce... plano de viagem personalizado em segundos."

### 2. `src/pages/Explorar.tsx`
- **Linha 26**: "Destinos fora do comum e experiencias exclusivas para viajantes que buscam o extraordinario." -> "Destinos incriveis para todos os perfis de viajante. Descubra o mundo com a ajuda da nossa IA."

### 3. `src/components/Footer.tsx`
- **Linha 20**: "Experiencias exclusivas e roteiros personalizados para cada aventureiro." -> "Viagens acessiveis para todos, com tecnologia de IA que facilita cada etapa da sua jornada."
- **Linha 60**: "Experiencias Exclusivas" -> "Tecnologia com IA"

### 4. `src/components/TeoWelcomePopup.tsx`
- **Linha 86**: "1o Agente de IA de Viagens do Brasil" -> "1o Agente de IA de Viagens B2C do Mundo"

### 5. `src/pages/Teo.tsx`
- Sem mudancas necessarias (ja esta neutro e acessivel).

---

## Alteracoes no Backend (Edge Functions)

### 6. `supabase/functions/generate-itinerary/index.ts`
- **Linha 62**: "uma agencia de viagens premium" -> "uma agencia de viagens inovadora, acessivel para todos os perfis de cliente"

### 7. `supabase/functions/generate-destination-image/index.ts`
- **Linha 69**: "premium-looking" -> "professional" (no prompt de geracao de imagem)

---

## Detalhes tecnicos

### Arquivos afetados (7 arquivos)

| Arquivo | Tipo de mudanca |
|---|---|
| `src/pages/Index.tsx` | Textos de 4 secoes |
| `src/pages/Explorar.tsx` | Texto do subtitulo |
| `src/components/Footer.tsx` | Descricao e item de servicos |
| `src/components/TeoWelcomePopup.tsx` | Badge do popup |
| `supabase/functions/generate-itinerary/index.ts` | System prompt |
| `supabase/functions/generate-destination-image/index.ts` | Image prompt |

### Palavras removidas/substituidas
- "premium" -> "inovadora" / "acessivel"
- "curadoria" -> "tecnologia de IA"
- "exclusivo/exclusivas" -> "personalizado" / "acessivel"
- "selecionados por especialistas" -> referencia a IA pioneira
- "do Brasil" -> "B2C do Mundo" (no badge do Teo)

### Deploy
Redeploy das edge functions `generate-itinerary` e `generate-destination-image` apos as alteracoes.

