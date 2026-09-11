/**
 * "מוח" נועה — רץ בצד השרת בלבד דרך שער ה-AI של Lovable (ללא מפתח חיצוני).
 */

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

export async function askNoaBrain(userMessage: string, senderName = "ראמי"): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return "ההודעה נקלטה בסידור ✅\n\nנועה ❤️ | סידור ח. סבן";

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: NOA_SYSTEM_INSTRUCTION },
          { role: "user", content: `הודעה מ-${senderName}: ${userMessage}` },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Noa brain gateway error", response.status, await response.text());
      return "ההודעה נקלטה בסידור ✅\n\nנועה ❤️ | סידור ח. סבן";
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    return text && text.length > 0
      ? text
      : "ההודעה נקלטה בסידור ✅\n\nנועה ❤️ | סידור ח. סבן";
  } catch (error) {
    console.error("Noa brain failure", error);
    return "ראמי, חלה שגיאה רגעית בתקשורת עם המוח של נועה. המידע נרשם במערכת.";
  }
}
