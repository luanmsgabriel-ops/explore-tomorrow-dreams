import { useEffect, useMemo, useRef, useState } from "react";
import { Captions, ChevronDown, MessageSquareText } from "lucide-react";

import type { VoiceTranscriptEntry } from "@/lib/realtimeVoice";
import { cn } from "@/lib/utils";

interface LiveTranscriptDrawerProps {
  entries: VoiceTranscriptEntry[];
  connected: boolean;
  className?: string;
}

function visibleEntries(entries: VoiceTranscriptEntry[]) {
  return entries
    .map((entry) => ({ ...entry, text: entry.text.trim() }))
    .filter((entry) => entry.text.length > 0)
    .slice(-12);
}

export function LiveTranscriptDrawer({ entries, connected, className }: LiveTranscriptDrawerProps) {
  const [open, setOpen] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const messages = useMemo(() => visibleEntries(entries), [entries]);
  const latest = messages.at(-1) ?? null;

  useEffect(() => {
    if (!open || !logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, open]);

  return (
    <div className={cn("rounded-2xl border border-tomorrow-line bg-[#061b1e]/82 backdrop-blur-xl", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="tomorrow-live-transcript"
        onClick={() => setOpen((current) => !current)}
        className="opportunity-focus flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white/[0.035]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-tomorrow-teal/35 bg-tomorrow-teal/8 text-tomorrow-teal-soft">
          <Captions className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-tomorrow-gold-soft">
            Legendas da conversa
          </span>
          <span className="mt-0.5 block truncate text-xs text-tomorrow-muted">
            {latest ? `${latest.role === "assistant" ? "Téo" : "Você"}: ${latest.text}` : connected ? "Aguardando a próxima fala." : "Disponíveis durante a sessão."}
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-tomorrow-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {latest ? `${latest.role === "assistant" ? "Téo" : "Você"}: ${latest.text}` : ""}
      </p>

      {open ? (
        <section id="tomorrow-live-transcript" aria-label="Transcrição da conversa" className="border-t border-tomorrow-line px-4 pb-4 pt-3">
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            className="max-h-56 space-y-2 overflow-y-auto overscroll-contain pr-1"
          >
            {messages.length ? messages.map((entry) => (
              <article
                key={`${entry.role}-${entry.id}`}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm leading-relaxed",
                  entry.role === "assistant"
                    ? "border-tomorrow-gold/20 bg-tomorrow-gold/6 text-tomorrow-text"
                    : "ml-5 border-tomorrow-teal/20 bg-tomorrow-teal/6 text-tomorrow-text",
                )}
              >
                <p className="mb-1 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-tomorrow-muted">
                  <MessageSquareText className="size-3" aria-hidden="true" />
                  {entry.role === "assistant" ? "Téo" : "Você"}
                  {!entry.final ? <span className="normal-case tracking-normal">• transcrevendo</span> : null}
                </p>
                <p>{entry.text}</p>
              </article>
            )) : (
              <p className="rounded-xl border border-dashed border-tomorrow-line px-3 py-5 text-center text-xs text-tomorrow-muted">
                A transcrição aparecerá aqui depois que a conversa começar.
              </p>
            )}
          </div>
          <p className="mt-3 text-[0.65rem] leading-relaxed text-tomorrow-muted">
            Este painel não grava a transcrição no armazenamento local. O conteúdo permanece apenas no estado desta página enquanto ela estiver aberta.
          </p>
        </section>
      ) : null}
    </div>
  );
}
