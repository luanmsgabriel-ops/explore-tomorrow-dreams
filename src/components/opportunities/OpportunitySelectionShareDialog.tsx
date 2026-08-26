import { Check, Copy, Link2, LoaderCircle, Share2, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { OpportunityButton } from "@/components/opportunities/OpportunityPrimitives";
import {
  createSharedOpportunitySelection,
  sharedSelectionAbsoluteUrl,
} from "@/lib/opportunitySelection";

export function OpportunitySelectionShareDialog({
  open,
  offerIds,
  onClose,
  onClear,
}: {
  open: boolean;
  offerIds: string[];
  onClose: () => void;
  onClear: () => void;
}) {
  const [customizing, setCustomizing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const createLink = async (custom: boolean) => {
    if (!offerIds.length || creating) return;
    setCreating(true);
    setError(null);
    setCopied(false);
    try {
      const selection = await createSharedOpportunitySelection(offerIds, custom ? {
        title,
        description,
      } : {});
      setCreatedUrl(sharedSelectionAbsoluteUrl(selection.token));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível gerar o link agora.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!createdUrl) return;
    await navigator.clipboard.writeText(createdUrl);
    setCopied(true);
  };

  const nativeShare = async () => {
    if (!createdUrl) return;
    if (navigator.share) {
      await navigator.share({ title: title.trim() || "Minha seleção Tomorrow Travel", url: createdUrl });
      return;
    }
    await copyLink();
  };

  const whatsappUrl = createdUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Veja esta seleção de oportunidades da Tomorrow Travel: ${createdUrl}`)}`
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/75 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="selection-dialog-title">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-tomorrow-lg border border-tomorrow-line bg-tomorrow-background p-5 shadow-2xl sm:mx-auto sm:max-w-xl sm:rounded-tomorrow-lg sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-tomorrow-line pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-tomorrow-teal-soft">Minha seleção</p>
            <h2 id="selection-dialog-title" className="mt-2 font-editorial text-3xl text-tomorrow-text">
              {offerIds.length} {offerIds.length === 1 ? "oportunidade escolhida" : "oportunidades escolhidas"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-tomorrow-muted">Gere um único link para compartilhar esta seleção com qualquer pessoa.</p>
          </div>
          <button type="button" className="opportunity-focus grid size-10 shrink-0 place-items-center rounded-full border border-tomorrow-line text-tomorrow-text" aria-label="Fechar seleção" onClick={onClose}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {!createdUrl ? (
          <div className="mt-5 grid gap-4">
            {customizing ? (
              <div className="grid gap-4 rounded-tomorrow border border-tomorrow-line bg-tomorrow-surface/60 p-4">
                <label className="grid gap-2 text-sm font-semibold text-tomorrow-text">
                  Título da seleção
                  <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Orlando em família" className="min-h-11 rounded-xl border border-tomorrow-line bg-tomorrow-background px-3 text-sm font-normal text-tomorrow-text outline-none focus:border-tomorrow-teal" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-tomorrow-text">
                  Mensagem opcional
                  <textarea value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Separei estas opções para compararmos juntos." className="min-h-24 resize-y rounded-xl border border-tomorrow-line bg-tomorrow-background p-3 text-sm font-normal text-tomorrow-text outline-none focus:border-tomorrow-teal" />
                </label>
              </div>
            ) : null}

            {error ? <p className="rounded-xl border border-tomorrow-danger/35 bg-tomorrow-danger/8 p-3 text-sm text-tomorrow-text" role="alert">{error}</p> : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <OpportunityButton variant="outline" disabled={creating} onClick={() => void createLink(false)}>
                {creating ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Link2 aria-hidden="true" />}
                Gerar link
              </OpportunityButton>
              <OpportunityButton variant={customizing ? "teal" : "gold"} disabled={creating} onClick={() => customizing ? void createLink(true) : setCustomizing(true)}>
                {creating && customizing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <SlidersHorizontal aria-hidden="true" />}
                {customizing ? "Gerar link personalizado" : "Personalizar link"}
              </OpportunityButton>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            <div className="rounded-tomorrow border border-tomorrow-teal/35 bg-tomorrow-teal/8 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-tomorrow-teal-soft">Link pronto</p>
              <p className="mt-2 break-all text-sm text-tomorrow-text">{createdUrl}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <OpportunityButton variant="outline" onClick={() => void copyLink()}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copiado" : "Copiar link"}</OpportunityButton>
              <OpportunityButton variant="outline" onClick={() => void nativeShare()}><Share2 aria-hidden="true" />Compartilhar</OpportunityButton>
              {whatsappUrl ? <OpportunityButton asChild variant="teal"><a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a></OpportunityButton> : null}
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-between gap-3 border-t border-tomorrow-line pt-4">
          <OpportunityButton variant="ghost" onClick={onClear}>Limpar seleção</OpportunityButton>
          {createdUrl ? <OpportunityButton variant="ghost" onClick={() => { setCreatedUrl(null); setCustomizing(false); setTitle(""); setDescription(""); }}>Gerar outro link</OpportunityButton> : null}
        </div>
      </div>
    </div>
  );
}
