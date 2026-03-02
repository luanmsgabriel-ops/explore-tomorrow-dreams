

## Plan: Add Knowledge Base Document to Teo

### Current State
- Teo's knowledge comes from two sources: the system prompt in `travel-advisor-chat/index.ts` and the `SALES_KNOWLEDGE` constant in `_shared/sales-knowledge.ts`
- The current `SALES_KNOWLEDGE` is ~60 lines covering basic sales techniques
- The new document is ~1590 lines covering 20 sections: identity, competitors, sales psychology, destinations (national + international), visas, payments, scripts, glossary, and more

### Approach
Replace the current `SALES_KNOWLEDGE` in `supabase/functions/_shared/sales-knowledge.ts` with the full content of the uploaded knowledge base document. This content gets appended to Teo's system prompt and will be available in every conversation.

### What changes

1. **Replace `sales-knowledge.ts`** - Overwrite the existing `SALES_KNOWLEDGE` constant with the full 1590-line document converted to a template literal string. This includes:
   - Identity and philosophy
   - Competitive analysis
   - Sales psychology and techniques
   - Mental triggers and persuasion
   - Objection handling
   - Upselling/cross-selling strategies
   - Tourism trends 2026
   - Client profiles
   - Seasonality calendar (national + international)
   - Complete destination guides (15+ national, 20+ international)
   - Documentation, visas, and travel insurance
   - Payment and installment options
   - WhatsApp best practices
   - Ready-made conversation scripts
   - Competitive differentiators
   - Travel industry glossary

2. **Remove redundant rules from system prompt** - Some rules already in the system prompt (like objection handling in `RESPOSTAS CONTEXTUAIS`) are now covered more thoroughly in the knowledge base. The system prompt rules will remain as they serve as hard behavioral constraints, while the knowledge base provides reference material.

### Technical Notes
- The knowledge base will be sent as part of the system prompt on every API call. Modern models handle large contexts well.
- Sensitive information (Cativa portal credentials in the appendix) will be included since this runs server-side only in the edge function.
- No database changes needed.

