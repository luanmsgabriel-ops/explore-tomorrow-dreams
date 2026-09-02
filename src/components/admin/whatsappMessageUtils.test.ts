import { describe, expect, it } from 'vitest';
import { dedupeMessages, getLastMessage, type WhatsAppMessage } from './whatsappMessageUtils';

const message = (role: string, content: string, timestamp: string): WhatsAppMessage => ({
  role,
  content,
  timestamp,
});

describe('whatsappMessageUtils', () => {
  it('remove duplicatas consecutivas com mesmo papel e conteúdo em até 15 segundos', () => {
    const messages = [
      message('assistant', 'Olá, Luan', '2026-09-02T15:00:00.000Z'),
      message('assistant', 'Olá, Luan', '2026-09-02T15:00:08.000Z'),
    ];

    expect(dedupeMessages(messages)).toEqual([messages[0]]);
  });

  it('preserva uma repetição legítima depois de 15 segundos', () => {
    const messages = [
      message('assistant', 'Posso ajudar?', '2026-09-02T15:00:00.000Z'),
      message('assistant', 'Posso ajudar?', '2026-09-02T15:00:16.000Z'),
    ];

    expect(dedupeMessages(messages)).toEqual(messages);
  });

  it('preserva o mesmo conteúdo quando os papéis são diferentes', () => {
    const messages = [
      message('user', 'Ok', '2026-09-02T15:00:00.000Z'),
      message('assistant', 'Ok', '2026-09-02T15:00:02.000Z'),
    ];

    expect(dedupeMessages(messages)).toEqual(messages);
  });

  it('preserva mensagens iguais quando não são consecutivas', () => {
    const messages = [
      message('user', 'Bom dia', '2026-09-02T15:00:00.000Z'),
      message('assistant', 'Bom dia! Como posso ajudar?', '2026-09-02T15:00:02.000Z'),
      message('user', 'Bom dia', '2026-09-02T15:00:05.000Z'),
    ];

    expect(dedupeMessages(messages)).toEqual(messages);
  });

  it('retorna a última mensagem sem depender de Array.at', () => {
    const messages = [
      message('user', 'Primeira', '2026-09-02T15:00:00.000Z'),
      message('assistant', 'Última', '2026-09-02T15:00:02.000Z'),
    ];

    expect(getLastMessage(messages)).toEqual(messages[1]);
    expect(getLastMessage([])).toBeUndefined();
  });
});
