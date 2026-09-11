CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  is_group boolean NOT NULL DEFAULT false,
  avatar_url text,
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread integer NOT NULL DEFAULT 0,
  muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'contact',
  sender_name text NOT NULL DEFAULT 'לא ידוע',
  sender_phone text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_created_idx ON public.messages (conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations are readable by everyone" ON public.conversations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "conversations are writable by everyone" ON public.conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "conversations are updatable by everyone" ON public.conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "messages are readable by everyone" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "messages are writable by everyone" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "messages are updatable by everyone" ON public.messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

INSERT INTO public.conversations (slug, name, phone, is_group, avatar_url, last_message, last_message_at, unread, muted) VALUES
  ('noa', 'נועה AI — ח. סבן חומרי בניין', 'dispatch_group', false, 'https://i.ibb.co/whtMgBNC/Gemini-Generated-Image-2.png', 'בוקר טוב ראמי ☀️ יש לנו 4 משימות פתוחות להיום.', now(), 0, false),
  ('sidur', 'עדכונים מהסידור', NULL, true, NULL, 'רמי: מחסן 30 סגור היום עד 12:00', now() - interval '30 minutes', 3, false),
  ('shark', 'קבלן שארק (מחסן 30)', '0522345678', false, NULL, 'צריך מכולה 12 קוב מחר בבוקר', now() - interval '50 minutes', 1, false),
  ('vered', 'ורד אידלסון', '0543219876', false, NULL, 'תודה! קיבלתי את החשבונית', now() - interval '1 day', 0, false),
  ('lina', 'לינה', '0509998877', false, NULL, 'אשלח את פרטי האתר בהמשך היום', now() - interval '1 day', 0, true);

INSERT INTO public.messages (conversation_id, author, sender_name, body, status, created_at)
SELECT c.id, 'noa', 'נועה AI', 'בוקר טוב ראמי ☀️ יש לנו 4 משימות פתוחות להיום. רוצה שאעבור עליהן?', 'read', now() - interval '2 hours'
FROM public.conversations c WHERE c.slug = 'noa';

INSERT INTO public.messages (conversation_id, author, sender_name, body, status, created_at)
SELECT c.id, 'me', 'ראמי מסארווה', 'כן, ותזמיני מכולה 12 קוב לשארק במחסן 30', 'read', now() - interval '119 minutes'
FROM public.conversations c WHERE c.slug = 'noa';

INSERT INTO public.messages (conversation_id, author, sender_name, body, status, created_at)
SELECT c.id, 'noa', 'נועה AI', E'קיבלתי ✅ פתחתי משימה חדשה:\n📥 *הצבה* — מכולה 12 קוב\n👷 קבלן שארק\n📍 האורגים 30, חולון\n🕐 היום, 11:00\n\nנועה ❤️ | סידור ח. סבן', 'read', now() - interval '118 minutes'
FROM public.conversations c WHERE c.slug = 'noa';