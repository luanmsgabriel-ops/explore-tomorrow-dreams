import { z } from 'zod';

// Regex patterns para validação
const PHONE_REGEX = /^[\d\s()+-]{10,20}$/;
const SAFE_TEXT_REGEX = /^[^<>{}]*$/; // Previne injeção básica de HTML/scripts

// Schema para e-mail
export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'E-mail inválido' })
  .max(255, { message: 'E-mail deve ter no máximo 255 caracteres' });

// Schema para e-mail opcional
export const optionalEmailSchema = z
  .string()
  .trim()
  .max(255, { message: 'E-mail deve ter no máximo 255 caracteres' })
  .refine((val) => val === '' || z.string().email().safeParse(val).success, {
    message: 'E-mail inválido',
  })
  .optional()
  .or(z.literal(''));

// Schema para WhatsApp/telefone
export const phoneSchema = z
  .string()
  .trim()
  .min(10, { message: 'Telefone deve ter no mínimo 10 dígitos' })
  .max(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  .regex(PHONE_REGEX, { message: 'Formato de telefone inválido' });

// Schema para texto seguro (previne XSS básico)
export const safeTextSchema = z
  .string()
  .trim()
  .max(1000, { message: 'Texto deve ter no máximo 1000 caracteres' })
  .regex(SAFE_TEXT_REGEX, { message: 'Caracteres não permitidos detectados' });

// Schema para texto curto
export const shortTextSchema = z
  .string()
  .trim()
  .max(200, { message: 'Texto deve ter no máximo 200 caracteres' })
  .regex(SAFE_TEXT_REGEX, { message: 'Caracteres não permitidos detectados' });

// Schema para nome
export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  .max(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  .regex(SAFE_TEXT_REGEX, { message: 'Caracteres não permitidos detectados' });

// Schema para o formulário de cotação
export const quoteFormSchema = z.object({
  destination_choice: shortTextSchema.optional(),
  other_destination: safeTextSchema.optional(),
  travel_date: shortTextSchema.optional(),
  num_people: shortTextSchema.optional(),
  travel_type: shortTextSchema.optional(),
  preferred_airport: shortTextSchema.optional(),
  flight_time_preference: shortTextSchema.optional(),
  traveling_with_children: shortTextSchema.optional(),
  special_requests: safeTextSchema.optional(),
  travel_word: shortTextSchema.optional(),
  email: emailSchema,
  whatsapp: phoneSchema,
  preferred_contact_time: shortTextSchema.optional(),
  preferred_contact_channel: shortTextSchema.optional(),
});

// Schema para o gerador de roteiro
export const itineraryFormSchema = z.object({
  name: nameSchema,
  email: optionalEmailSchema,
  whatsapp: phoneSchema,
  preferences: safeTextSchema.optional(),
});

// Schema para o gerador de imagem
export const imageGeneratorSchema = z.object({
  email: emailSchema,
  whatsapp: phoneSchema,
});

// Schema para mensagens de chat
export const chatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: 'Mensagem não pode estar vazia' })
    .max(2000, { message: 'Mensagem deve ter no máximo 2000 caracteres' }),
});

// Tipo para erros de validação
export type ValidationError = {
  field: string;
  message: string;
};

// Função helper para validar e retornar erros formatados
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: ValidationError[] = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  
  return { success: false, errors };
}

// Gera um ID de sessão criptograficamente seguro
export function generateSecureSessionId(): string {
  return crypto.randomUUID();
}

// Sanitiza texto para uso seguro (remove caracteres potencialmente perigosos)
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>{}]/g, '')
    .trim()
    .slice(0, 1000);
}
