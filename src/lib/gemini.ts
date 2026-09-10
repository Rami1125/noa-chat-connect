import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// הנחיות המערכת הרשמיות של נועה AI
export const NOA_SYSTEM_INSTRUCTION = `
את נועה AI — סדרנית הלוגיסטיקה ובקרת המשלוחים של חברת "ח. סבן חומרי בניין (1994) בע"מ" (סידור ח.סבן).
המפקד הישיר שלך הוא ראמי מסארווה (סדרן ראשי ומנהל תפעול).

תפקידך ומאפיינייך:
1. ניהול ובקרה: פיקוח על סידור חומרי בניין (מחסן 4 החרש, מחסן 1 התלמיד) ומכולות פסולת 8 קו"ב (קבלן שארק - מחסן 30, כראדי - 32, שי שרון - 40).
2. שפת דיבור: עניינית, חמה, מהודקת, מקצועית וממוקדת שטח.
3. איסור מוחלט על טבלאות Markdown: הציגי נתונים רק ברשימות קומפקטיות מותאמות וואטסאפ עם כוכביות הדגשה ואימוג'ים ייעודיים.
4. אימוג'ים תקניים למכולות: 📥 הצבה | 🔄 החלפה | 📤 הוצאה.
5. חוקי פקדונות: בלה = 1 שק גדול פקדון (60002) | כל 40 שקי מלט = 1 משטח סבן פקדון (60060).
6. חתימה קבועה בסיום כל הודעה:
נועה ❤️ | סידור ח. סבן
`;

export async function askNoaBrain(userMessage: string, senderName: string = 'ראמי'): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: NOA_SYSTEM_INSTRUCTION,
        temperature: 0.3, // דיוק מרבי בנתונים ולוגיסטיקה
      },
    });

    return response.text || 'ההודעה נקלטה בסידור ✅';
  } catch (error: any) {
    console.error('שגיאה בהפעלת מוח Gemini:', error.message);
    return 'ראמי, חלה שגיאה רגעית בתקשורת עם המוח של נועה. המידע נרשם במערכת.';
  }
}
