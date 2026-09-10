import { describe, expect, it } from 'vitest';
import { getQuoteDisplayEmail, getQuoteDisplayName, isManualQuoteEmail } from './quoteDisplayUtils';

describe('quote display helpers', () => {
  it('uses the client name when it exists', () => {
    expect(getQuoteDisplayName({ client_name: 'Maria Silva', email: null, whatsapp: '5511999999999' }))
      .toBe('Maria Silva');
  });

  it('renders quotes without email without throwing', () => {
    expect(getQuoteDisplayName({ client_name: null, email: null, whatsapp: '5511999999999' }))
      .toBe('5511999999999');
    expect(getQuoteDisplayEmail(null)).toBe('');
  });

  it('uses the email prefix for regular quotes', () => {
    expect(getQuoteDisplayName({ client_name: null, email: 'cliente@exemplo.com', whatsapp: null }))
      .toBe('cliente');
    expect(getQuoteDisplayEmail('cliente@exemplo.com')).toBe('cliente@exemplo.com');
  });

  it('hides generated manual email addresses', () => {
    expect(isManualQuoteEmail('manual-123@manual.local')).toBe(true);
    expect(getQuoteDisplayName({ email: 'manual-123@manual.local', whatsapp: '5511888888888' }))
      .toBe('5511888888888');
    expect(getQuoteDisplayEmail('manual-123@manual.local')).toBe('');
  });

  it('uses a stable fallback when no identity field is available', () => {
    expect(getQuoteDisplayName({ email: null, whatsapp: null })).toBe('Cliente');
  });
});
