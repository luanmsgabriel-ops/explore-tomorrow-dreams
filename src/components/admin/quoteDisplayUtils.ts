interface QuoteIdentity {
  client_name?: string | null;
  email?: string | null;
  whatsapp?: string | null;
}

const normalizedValue = (value?: string | null) => value?.trim() ?? '';

export const isManualQuoteEmail = (email?: string | null) =>
  normalizedValue(email).toLowerCase().endsWith('@manual.local');

export const getQuoteDisplayName = ({ client_name, email, whatsapp }: QuoteIdentity) => {
  const clientName = normalizedValue(client_name);
  if (clientName) return clientName;

  const normalizedEmail = normalizedValue(email);
  if (normalizedEmail && !isManualQuoteEmail(normalizedEmail)) {
    return normalizedEmail.split('@')[0] || normalizedEmail;
  }

  return normalizedValue(whatsapp) || 'Cliente';
};

export const getQuoteDisplayEmail = (email?: string | null) => {
  const normalizedEmail = normalizedValue(email);
  return normalizedEmail && !isManualQuoteEmail(normalizedEmail) ? normalizedEmail : '';
};
