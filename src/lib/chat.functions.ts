import { askNoaBrain } from './gemini';

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || 'https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr';

export interface SendMessagePayload {
  chatId: string;
  senderName: string;
  messageText: string;
}

export async function handleIncomingUserMessage(payload: SendMessagePayload) {
  const { chatId, senderName, messageText } = payload;

  console.log(`[Chat Action] התקבלה הודעה מ-${senderName}: ${messageText}`);

  // 1. שידור ההודעה במקביל ל-Make.com (לעדכון גיליונות ושיגור לוואטסאפ)
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

  // 2. הפעלת מוח Gemini להפקת תשובה חכמה של נועה בזמן אמת
  const aiReplyPromise = askNoaBrain(messageText, senderName);

  // המתנה לתשובת ה-AI
  const [_, aiReply] = await Promise.all([webhookPromise, aiReplyPromise]);

  return {
    success: true,
    reply: aiReply,
    timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  };
}
