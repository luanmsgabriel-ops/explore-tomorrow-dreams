

# Plano: Téo Grupal — Viagem em grupo com cruzamento de preferências

## Conceito
Cada pessoa do grupo conversa separadamente com o Téo no WhatsApp. O Téo cruza as preferências de todos e sugere o destino com maior "score de compatibilidade" para o grupo. Ativação via comando WhatsApp.

---

## 1. Nova tabela: `travel_groups`

```sql
CREATE TABLE public.travel_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code text NOT NULL UNIQUE,
  creator_phone text NOT NULL,
  creator_name text,
  group_name text,
  status text NOT NULL DEFAULT 'collecting', -- collecting, ready, completed
  travel_dates text,
  budget_range text,
  final_recommendation jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.travel_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.travel_groups(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  member_name text,
  preferences jsonb DEFAULT '{}',
  -- preferences: { estilo: "aventura", clima: "tropical", prioridades: ["praia","gastronomia"], orcamento: "moderado", restricoes: "sem escalas longas" }
  is_ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, phone_number)
);

ALTER TABLE public.travel_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage travel_groups" ON public.travel_groups FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage travel_group_members" ON public.travel_group_members FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert travel_groups" ON public.travel_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert travel_group_members" ON public.travel_group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update travel_groups" ON public.travel_groups FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Service can update travel_group_members" ON public.travel_group_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Service can select travel_groups" ON public.travel_groups FOR SELECT USING (true);
CREATE POLICY "Service can select travel_group_members" ON public.travel_group_members FOR SELECT USING (true);
```

## 2. Fluxo do WhatsApp (whatsapp-webhook/index.ts)

### 2.1 Comandos reconhecidos

| Comando | Ação |
|---------|------|
| `criar grupo` ou `viagem em grupo` | Cria grupo, gera código de 6 chars, envia ao criador |
| `entrar grupo XYZABC` | Adiciona membro ao grupo |
| `meu grupo` | Mostra status do grupo, quem já respondeu |
| `pronto grupo` ou responder "sim" ao questionário | Marca membro como `is_ready` |
| `resultado grupo` | Se todos prontos, cruza preferências via Gemini e envia resultado |
| `sair grupo` | Remove membro do grupo |

### 2.2 Questionário individual (após entrar no grupo)

Quando um membro entra, o Téo envia uma sequência de perguntas curtas que ficam em `_group_mode` no `collected_data`:

1. "Qual seu estilo de viagem? (aventura, relax, cultural, gastronômico, festas, misto)"
2. "Clima preferido? (tropical, frio, temperado, tanto faz)"
3. "Top 3 prioridades? (praia, montanha, cidade, gastronomia, esportes, vida noturna, natureza, história)"
4. "Faixa de orçamento? (econômico, moderado, premium, luxo)"
5. "Alguma restrição? (datas fixas, sem escalas longas, precisa de visto fácil, nenhuma)"

As respostas são salvas em `travel_group_members.preferences` como JSON.

### 2.3 Cruzamento de preferências

Quando todos estão prontos (ou o criador pede `resultado grupo`), o Téo:
1. Busca todos os membros e suas preferências
2. Envia para Gemini 2.5 Flash com prompt especializado
3. Gemini analisa compatibilidade e sugere 3 destinos ranqueados com:
   - Nome do destino
   - Score de compatibilidade (0-100%)
   - Por que combina com o grupo
   - Quem vai adorar / quem pode não curtir tanto
4. Resultado salvo em `travel_groups.final_recommendation`
5. Enviado a TODOS os membros do grupo via WhatsApp

### 2.4 Isolamento de modo

Enquanto `_group_mode` está ativo no `collected_data`, o Téo processa mensagens como respostas ao questionário. Após concluir, `_group_mode` é desativado e o fluxo normal volta.

## 3. Lógica no webhook

Novo bloco adicionado antes do fluxo principal (~após o mode isolation existente):

```text
Se messageText match "criar grupo" / "viagem em grupo":
  → Gerar código 6 chars (ex: "TRV4K9")
  → INSERT travel_groups (group_code, creator_phone, creator_name)
  → INSERT travel_group_members (group_id, phone_number, member_name)
  → Enviar: "🎉 Grupo criado! Código: *TRV4K9*\nCompartilhe com seus amigos! Eles devem mandar: *entrar grupo TRV4K9*"
  → Setar _group_mode: "questioning", _group_id, _group_step: 1
  → Enviar primeira pergunta
  → return

Se messageText match "entrar grupo XXXXXX":
  → Buscar grupo pelo código
  → Se não encontrado ou status != 'collecting': erro
  → INSERT travel_group_members
  → Setar _group_mode, _group_id, _group_step: 1
  → Enviar primeira pergunta
  → return

Se _group_mode === "questioning":
  → Salvar resposta do step atual em preferences
  → Incrementar _group_step
  → Se step <= 5: enviar próxima pergunta
  → Se step > 5: marcar is_ready=true, enviar confirmação
  → Notificar criador: "X de Y membros prontos!"
  → Se todos prontos: disparar cruzamento automático
  → return

Se messageText match "resultado grupo":
  → Buscar grupo do criador
  → Verificar se todos prontos (ou forçar com quem está)
  → Chamar Gemini para cruzamento
  → Enviar resultado a todos os membros
  → return
```

## 4. Prompt do cruzamento (Gemini)

```text
Você é um especialista em viagens de grupo. Analise as preferências de N viajantes e sugira os 3 melhores destinos.

MEMBROS DO GRUPO:
[lista com nome e preferências de cada um]

REGRAS:
- Sugira 3 destinos ranqueados por compatibilidade (0-100%)
- Para cada destino, explique por que combina com o grupo
- Identifique possíveis conflitos ("João prefere frio mas Maria quer praia")
- Sugira compromissos ("Gramado tem frio + gastronomia + natureza")
- Use destinos reais, específicos (não "Nordeste", mas "Porto de Galinhas")
- Considere orçamento médio do grupo
- Formato WhatsApp com emojis
```

## 5. Arquivos modificados

1. **Migração SQL**: Criar tabelas `travel_groups` e `travel_group_members`
2. **`supabase/functions/whatsapp-webhook/index.ts`**: Novo bloco de lógica para comandos de grupo, questionário step-by-step, cruzamento via Gemini, envio de resultados a todos os membros

