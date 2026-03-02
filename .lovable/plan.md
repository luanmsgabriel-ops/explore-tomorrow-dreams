

## Plan: Cotação Visual com PDF Automático

### Objetivo
Quando o Téo finaliza uma cotação (via WhatsApp ou site), além do texto, gerar automaticamente um PDF visual profissional com a identidade da Tomorrow Travel e enviá-lo como documento no WhatsApp.

### Arquitetura

O PDF será gerado server-side via Edge Function usando HTML → PDF (via Puppeteer/Chromium não está disponível em Deno, então usaremos a abordagem de gerar HTML estilizado e converter para PDF usando a biblioteca `jspdf` + layout manual, OU gerar uma imagem via Gemini com os dados da cotação formatados).

**Abordagem escolhida**: Gerar o PDF como HTML renderizado em string e convertê-lo usando a API `@vercel/og`-style approach não é viável em Deno. A melhor abordagem para Edge Functions Deno é **gerar um PDF programaticamente** usando manipulação de bytes ou usar a Lovable AI para gerar uma **imagem visual** da cotação (como já fazemos para banners com `generate-promo-image`) e enviar como documento/imagem no WhatsApp.

**Abordagem final**: Usar Gemini para gerar uma **imagem visual da cotação** (similar ao banner generator existente) e enviá-la via WhatsApp como imagem. Isso é mais impactante visualmente que um PDF e funciona perfeitamente no WhatsApp.

### Mudanças

#### 1. Nova Edge Function `generate-quote-visual/index.ts`
- Recebe dados da cotação (destino, hotel, voos, preço, datas, passageiros)
- Usa Gemini (image generation model) para criar uma imagem profissional estilizada com:
  - Logo Tomorrow Travel
  - Nome do destino com foto de fundo
  - Detalhes do hotel (nome, estrelas, regime)
  - Datas e voos
  - Preço total destacado
  - Parcelas se disponível
  - Inclusões
- Retorna a URL da imagem gerada
- Armazena no bucket `destination-images` para persistência

#### 2. Nova função `sendWhatsAppDocument` no `whatsapp-webhook`
- Adicionar função para enviar imagens/documentos via WhatsApp Graph API
- Usa o endpoint de `image` do WhatsApp para enviar a cotação visual
- Caption com resumo curto dos valores

#### 3. Integrar no fluxo de cotação (`whatsapp-webhook/index.ts`)
- Após a cotação retornar resultados (`formatQuotationResults`), chamar `generate-quote-visual` em paralelo
- Enviar primeiro o texto da cotação (como já faz)
- Em seguida enviar a imagem visual da cotação
- Fire-and-forget para não atrasar a resposta de texto

#### 4. Integrar no fluxo do site (`travel-advisor-chat/index.ts`)
- Quando detectar `[COTAR_VIAGEM]` e tiver resultado, gerar o visual
- Disponibilizar link para download no chat do site

#### 5. Config
- Adicionar `generate-quote-visual` ao `supabase/config.toml` com `verify_jwt = false`

### Fluxo

```text
Cotação retorna resultado
       ↓
[Paralelo] Envia texto formatado no WhatsApp (já existe)
[Paralelo] Chama generate-quote-visual com dados da cotação
       ↓
Gemini gera imagem profissional da cotação
       ↓
Upload para storage (destination-images)
       ↓
Envia imagem no WhatsApp via Graph API (type: image)
```

### O que NÃO muda
- Fluxo de coleta de dados do Téo
- Formato da cotação em texto (continua sendo enviado)
- Tabelas existentes

### Nota técnica
- Usamos geração de imagem via Gemini (model `google/gemini-3-pro-image-preview`) pois é a mesma abordagem já validada no `generate-promo-image` e `generate-destination-image`
- Imagem é mais impactante no WhatsApp que PDF (preview inline, não precisa abrir)
- O cliente pode salvar e compartilhar facilmente

