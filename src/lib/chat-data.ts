export const NOA_AVATAR = "https://i.ibb.co/whtMgBNC/Gemini-Generated-Image-2.png";

export type ContainerAction = "placement" | "swap" | "removal";

export type TaskCard = {
  title: string;
  customer: string;
  address: string;
  wazeQuery: string;
  containerType: string;
  action: ContainerAction;
  scheduledFor: string;
};

export type MessageAuthor = "me" | "noa" | "contact";
export type MessageStatus = "pending" | "sent" | "delivered" | "read";

export type Message = {
  id: string;
  author: MessageAuthor;
  senderName: string;
  text: string;
  time: string;
  status?: MessageStatus;
  card?: TaskCard;
};

export type Conversation = {
  id: string;
  slug: string;
  name: string;
  avatar?: string | null;
  initials: string;
  preview: string;
  time: string;
  unread: number;
  muted?: boolean;
  isGroup: boolean;
};

export const ACTION_LABELS: Record<ContainerAction, { emoji: string; label: string }> = {
  placement: { emoji: "📥", label: "הצבה" },
  swap: { emoji: "🔄", label: "החלפה" },
  removal: { emoji: "📤", label: "הוצאה" },
};

export const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤔","😅",
  "👍","🙏","👏","💪","🔥","✅","❌","⚠️","🚚","🏗️",
  "📥","🔄","📤","📦","📍","🕐","💰","📄","🎯","❤️",
];

export function formatTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit" }).format(date);
}

export function initialsOf(name: string) {
  return name.trim().charAt(0) || "?";
}
