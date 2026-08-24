import { useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { sendChatbotMessage } from "@/services/chatbot.service";
import { ApiError } from "@/services/http";

interface ChatEntry {
  id: string;
  author: "user" | "bot";
  content: string;
  escalate?: boolean;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    const userEntry: ChatEntry = { id: `u-${Date.now()}`, author: "user", content };
    setEntries((prev) => [...prev, userEntry]);
    setDraft("");
    setIsSending(true);

    try {
      const result = await sendChatbotMessage(content);
      setEntries((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, author: "bot", content: result.reply, escalate: result.escalate },
      ]);
    } catch (error) {
      setEntries((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          author: "bot",
          content:
            error instanceof ApiError
              ? error.message
              : "Le chatbot est momentanément indisponible, réessayez plus tard.",
        },
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Ouvrir l'assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[340px] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="flex items-center gap-2 text-[13.5px] font-semibold">
          <Bot className="h-4 w-4" strokeWidth={1.8} />
          Assistant Sortlist
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Fermer l'assistant"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {entries.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            Posez une question — sur votre projet, votre facturation ou le fonctionnement de la
            plateforme.
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={
                entry.author === "user"
                  ? "ml-6 rounded-lg border border-border px-3 py-2"
                  : "mr-6 rounded-lg bg-accent px-3 py-2"
              }
            >
              <p className="whitespace-pre-line text-[13px] leading-[1.5]">{entry.content}</p>
              {entry.escalate ? (
                <p className="mt-1.5 text-[11.5px] font-semibold text-muted-foreground">
                  Transmis à un conseiller humain
                </p>
              ) : null}
            </div>
          ))
        )}
        {isSending ? (
          <div className="mr-6 flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} />
            <p className="text-[12.5px]">L'assistant écrit...</p>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Votre question..."
          className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          aria-label="Envoyer"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </form>
    </div>
  );
}
