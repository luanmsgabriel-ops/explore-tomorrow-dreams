export interface WhatsAppMessage {
  role: string;
  content: string;
  timestamp: string;
}

const getMessageTimestamp = (message: WhatsAppMessage) => {
  const value = new Date(message.timestamp || 0).getTime();
  return Number.isNaN(value) ? 0 : value;
};

export const dedupeMessages = (messages: WhatsAppMessage[]) => {
  return messages.reduce<WhatsAppMessage[]>((result, message) => {
    const previous = result[result.length - 1];

    if (!previous) {
      result.push(message);
      return result;
    }

    const samePayload = previous.role === message.role && previous.content === message.content;
    const timeDistance = Math.abs(getMessageTimestamp(message) - getMessageTimestamp(previous));

    if (samePayload && timeDistance <= 15_000) {
      return result;
    }

    result.push(message);
    return result;
  }, []);
};

export const getLastMessage = (messages: WhatsAppMessage[]) => {
  return messages.length > 0 ? messages[messages.length - 1] : undefined;
};
