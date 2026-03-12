

## Plano: Téo School — Banco Dedicado, Badges por Imagem e Notificações Diárias

### Problema Atual
O progresso do School fica apenas no `collected_data` da `whatsapp_conversations`. Se for limpo, o progresso se perde. Não há badges visuais nem lembretes diários.

### 3 Componentes

---

#### 1. Tabela `school_progress` (persistência dedicada)

```sql
CREATE TABLE school_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  client_name text,
  language text DEFAULT 'en',
  level text DEFAULT 'beginner',
  current_module int DEFAULT 1,
  current_lesson int DEFAULT 1,
  total_score int DEFAULT 0,
  streak_days int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_study_date date,
  lessons_completed int DEFAULT 0,
  modules_completed int DEFAULT 0,
  badges jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS: no public access (service role only, same as client_memory)
```

#### 2. Tabela `school_badges` (imagens padronizadas reutilizáveis)

```sql
CREATE TABLE school_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key text UNIQUE NOT NULL,
  badge_name text NOT NULL,
  badge_description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);
```

**10 badges pré-definidos** (imagens geradas via Gemini Image Generation com branding Tomorrow Travel + Téo e salvas no bucket `destination-images`):

| badge_key | Nome | Gatilho |
|-----------|------|---------|
| first_lesson | Primeiro Passo 🌱 | 1a lição completa |
| module_complete | Módulo Completo 📖 | Completou 1 módulo (5 lições) |
| streak_3 | Streak 3 Dias 🔥 | 3 dias seguidos |
| streak_7 | Streak 7 Dias ⚡ | 7 dias seguidos |
| streak_15 | Streak 15 Dias 🌟 | 15 dias seguidos |
| streak_30 | Streak 30 Dias 🏆 | 30 dias seguidos |
| intermediate | Intermediário 🌿 | Avançou de nível |
| advanced | Avançado 🌳 | Avançou de nível |
| score_100 | 100 Pontos 💯 | Atingiu 100 pts |
| graduation | Formatura 🎓 | 10 módulos completos |

**Geração das imagens**: Uma edge function `generate-school-badges` será criada para gerar as 10 imagens de badge via Gemini Image Generation (modelo `google/gemini-3-pro-image-preview`), fazer upload no bucket `destination-images/school-badges/` e salvar as URLs na tabela `school_badges`. Roda uma vez para popular.

---

#### 3. Alterações no `whatsapp-webhook`

- **Ao iniciar School**: carregar progresso de `school_progress` (se existir) em vez de depender apenas do `collected_data`
- **Ao completar lição**: salvar em `school_progress` (score, lesson, module) + calcular streak (se `last_study_date` = ontem, streak++; senão reset)
- **Ao avançar**: verificar badges elegíveis, buscar imagem da `school_badges`, enviar via `sendWhatsAppImage()`
- **Previsão de avanço**: ao final de cada lição, incluir mensagem tipo "Se estudar 1 lição/dia, em X dias você completa o Módulo Y!"

#### 4. Notificações diárias via `concierge-engine`

Nova action `school_reminders`:
- Roda 1x/dia (10h BRT) via cron
- Busca alunos em `school_progress` com `last_study_date < hoje`
- Se streak > 0: "Você tem uma sequência de X dias! Não quebre agora! 🔥 Mande *escola*"
- Se streak = 0: "Hora da sua aula! 📚 Mande *escola* pra começar"
- Inclui previsão: "Faltam Y lições para o próximo módulo!"

### Arquivos modificados

1. **Migração SQL**: criar `school_progress` + `school_badges` com RLS
2. **`supabase/functions/generate-school-badges/index.ts`** (novo): gera 10 imagens de badge e popula a tabela
3. **`supabase/functions/whatsapp-webhook/index.ts`**: sincronizar com `school_progress`, lógica de streak, envio de badges com imagem, previsão de avanço
4. **`supabase/functions/concierge-engine/index.ts`**: nova action `school_reminders` + cron diário

