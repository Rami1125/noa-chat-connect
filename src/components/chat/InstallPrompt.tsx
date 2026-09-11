import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

import { NOA_AVATAR } from "@/lib/chat-data";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "noa-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const ua = window.navigator.userAgent;
    setIsIos(/iPad|iPhone|iPod/.test(ua));
    setVisible(true);

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  return (
    <section className="mx-auto mb-3 w-full max-w-md rounded-xl border border-wa-divider bg-wa-panel/95 p-3 shadow-lg backdrop-blur">
      <div className="flex items-start gap-3">
        <img src={NOA_AVATAR} alt="נועה AI" className="size-11 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-wa-bubble-text">
            התקינו את נועה AI במסך הבית
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-wa-meta">
            כך הצ&apos;אט נפתח כאפליקציה מלאה, עם הלוגו של נועה, מסך מלא וצליל התראה על כל הודעה
            חדשה שנכנסת מוואטסאפ.
          </p>

          {isIos ? (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-wa-green">
              <Share className="size-4" />
              בספארי: שיתוף ← &quot;הוספה למסך הבית&quot;
            </p>
          ) : (
            <button
              type="button"
              onClick={install}
              disabled={!deferred}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-wa-green px-4 py-1.5 text-sm font-medium text-wa-shell transition-colors hover:bg-wa-green-strong disabled:opacity-60"
            >
              <Download className="size-4" />
              {deferred ? "התקנה עכשיו" : "פתחו את תפריט הדפדפן ← התקנת אפליקציה"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="סגירת ההצעה"
          className="rounded-full p-1 text-wa-meta transition-colors hover:bg-wa-hover"
        >
          <X className="size-4" />
        </button>
      </div>
    </section>
  );
}
