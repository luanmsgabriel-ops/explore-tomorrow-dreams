

## Plan: Téo com Memória de Longo Prazo

### Objetivo
Criar um sistema onde o Téo reconhece clientes que retornam (pelo WhatsApp) e usa informações de conversas anteriores para personalizar o atendimento.

### Mudanças

#### 1. Nova tabela `client_memory` (migração)
```sql
CREATE TABLE public.client_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp text NOT NULL,
  client_name text,
  preferences jsonb DEFAULT '{}'::jsonb,
  travel_history jsonb DEFAULT '[]'::jsonb,
  personal_notes jsonb DEFAULT '{}'::jsonb,
  last_interaction_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(whatsapp)
);
ALTER TABLE public.client_memory ENABLE ROW LEVEL SECURITY;
-- RLS: apenas admins leem, inserção pública via edge function (service role)
CREATE POLICY "No public access" ON public.client_memory FOR ALL USING (false) WITH CHECK (false);
```

Campos do JSONB `preferences`: estilo de viagem, clima preferido, tipo (praia/cidade/aventura), faixa de orçamento (luxo/custo-benefício), companhia habitual (casal/família/amigos).

Campos do JSONB `travel_history`: array de objetos com destino, datas, número de pessoas, se cotou, se fechou.

Campos do JSONB `personal_notes`: aniversário, nomes dos filhos/acompanhantes, observações especiais.

#### 2. Edge Function `travel-advisor-chat/index.ts`
- **Antes de montar o prompt**: buscar memória do cliente pelo WhatsApp (`userWhatsapp`) na tabela `client_memory`
- **Injetar contexto no system prompt**: se encontrar memória, adicionar seção `MEMÓRIA DO CLIENTE` com dados formatados (destinos visitados, preferências, notas pessoais)
- **Após o stream**: usar o conteúdo da conversa para atualizar a memória via uma chamada ao Gemini que extrai dados estruturados da conversa (preferências mencionadas, destinos discutidos, informações pessoais reveladas) e faz upsert na tabela `client_memory`

#### 3. Atualização do System Prompt
Adicionar regra ao prompt do Téo:

```
REGRA DE MEMÓRIA (OBRIGATÓRIO):
- Se houver MEMÓRIA DO CLIENTE, use-a naturalmente na conversa
- Mencione destinos já visitados: "Da última vez falamos sobre Maldivas, lembra?"
- Use preferências conhecidas para sugerir destinos sem precisar perguntar tudo de novo
- Se souber nomes de filhos/aniversários, mencione com naturalidade
- NÃO liste todos os dados de uma vez — use aos poucos, de forma orgânica
- Se o cliente nunca interagiu antes, siga o fluxo normal
```

#### 4. Extração de memória (pós-stream)
Após salvar a resposta do assistente, chamar Gemini com um prompt de extração:

```
Analise esta conversa e extraia dados para o perfil do cliente:
- Preferências: tipo de viagem, orçamento, estilo
- Destinos mencionados/interessados
- Informações pessoais: filhos (nomes/idades), aniversário, etc.
Retorne APENAS um JSON válido.
```

Fazer `upsert` na tabela `client_memory` mesclando dados novos com existentes.

#### 5. WhatsApp webhook (`whatsapp-webhook/index.ts`)
Aplicar a mesma lógica: buscar memória pelo phone_number antes de montar o prompt, e atualizar após a conversa.

### Fluxo resumido

```text
Cliente envia mensagem (WhatsApp informado)
       ↓
Edge Function busca client_memory por whatsapp
       ↓
Se encontrar → injeta MEMÓRIA no system prompt
Se não → fluxo normal (primeira vez)
       ↓
Conversa acontece normalmente
       ↓
Após stream completo → Gemini extrai dados → upsert client_memory
```

### O que NÃO muda
- Fluxo de coleta de nome/WhatsApp no frontend
- Estrutura do TeoChat.tsx (apenas passa o WhatsApp que já coleta)
- Tabelas existentes

