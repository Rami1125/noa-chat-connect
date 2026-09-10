import { askNoaBrain } from './gemini';

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || 'https://hook.eu1.make.com/yvywlj4kpryenbte86oedh4826glhb3u';

export interface SendMessagePayload {
  chatId: string;
  senderName: string;
  messageText: string;
}

export async function sendMessageToMake(payload: SendMessagePayload) {
  const { chatId, senderName, messageText } = payload;

  console.log(`[Chat Action] התקבלה הודעה מ-${senderName}: ${messageText}`);

  const webhookPromise = fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'pwa_chat_ui',
      chatId,
      senderName,
      messageBody: messageText,
      timestamp: Math.floor(Date.now() / 1000),
      isoTime: new Date().toISOString()
    })
  }).catch(err => console.warn('[Make Webhook Error]:', err.message));

  const aiReplyPromise = askNoaBrain(messageText, senderName);

  const [_, aiReply] = await Promise.all([webhookPromise, aiReplyPromise]);

  return {
    success: true,
    reply: aiReply,
    timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  };
}
