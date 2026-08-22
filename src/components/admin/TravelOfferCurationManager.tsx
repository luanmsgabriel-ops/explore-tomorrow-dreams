import { useCallback, useEffect, useMemo, useState } from "react";
import { BookmarkPlus, EyeOff, Search, Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type OfferRow = {
  id: string;
  offer_type: string;
  source_type: string | null;
  origin_city: string | null;
  origin_iata: string | null;
  destination_name: string | null;
  destination_iata: string | null;
  departure_date: string | null;
  return_date: string | null;
  currency: string | null;
  price_per_person: number | string | null;
  active: boolean;
};

type CurationRow = {
  offer_id: string;
  is_hidden: boolean;
  is_featured: boolean;
  sort_order: number;
  campaign_label: string | null;
  editorial_title: string | null;
  editorial_subtitle: string | null;
  editorial_image_url: string | null;
  expires_at: string | null;
  updated_at?: string;
};

type CollectionRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

const EMPTY_CURATION = (offerId: string): CurationRow => ({
  offer_id: offerId,
  is_hidden: false,
  is_featured: false,
  sort_order: 0,
  campaign_label: null,
  editorial_title: null,
  editorial_subtitle: null,
  editorial_image_url: null,
  expires_at: null,
});

const normalizeNullable = (value: string) => value.trim() || null;

const toDateTimeLocal = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const formatCurrency = (value: number | string | null, currency: string | null) => {
  if (value === null) return "Valor não informado";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Valor não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency && /^[A-Z]{3}$/.test(currency) ? currency : "BRL",
  }).format(number);
};

const formatDate = (value: string | null) => {
  if (!value) return "Data não informada";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
};

const offerRoute = (offer: OfferRow) => {
  const origin = offer.origin_iata || offer.origin_city || "Origem não informada";
  const destination = offer.destination_iata || offer.destination_name || "Destino não informado";
  return `${origin} → ${destination}`;
};

export const TravelOfferCurationManager = () => {
  // As tabelas da Etapa 9 já existem no banco, mas o arquivo gerado de tipos ainda não foi regenerado.
  // Mantemos o cast restrito a este módulo até a próxima geração automática dos tipos do Supabase.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const curationDb = supabase as any;

  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [curations, setCurations] = useState<Record<string, CurationRow>>({});
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CurationRow | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [newCollectionSlug, setNewCollectionSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === selectedOfferId) ?? null,
    [offers, selectedOfferId],
  );

  const loadCollections = useCallback(async () => {
    const { data, error } = await curationDb
      .from("travel_offer_collections")
      .select("id, slug, title, description, is_active, sort_order, starts_at, ends_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    setCollections((data ?? []) as CollectionRow[]);
  }, [curationDb]);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("travel_offers")
        .select(
          "id, offer_type, source_type, origin_city, origin_iata, destination_name, destination_iata, departure_date, return_date, currency, price_per_person, active",
        )
        .eq("active", true)
        .order("departure_date", { ascending: true, nullsFirst: false })
        .limit(50);

      const term = search.trim();
      if (term) query = query.ilike("destination_name", `%${term}%`);

      const { data, error } = await query;
      if (error) throw error;

      const nextOffers = (data ?? []) as OfferRow[];
      setOffers(nextOffers);

      const ids = nextOffers.map((offer) => offer.id);
      if (!ids.length) {
        setCurations({});
        setSelectedOfferId(null);
        setDraft(null);
        return;
      }

      const { data: curationData, error: curationError } = await curationDb
        .from("travel_offer_curation")
        .select(
          "offer_id, is_hidden, is_featured, sort_order, campaign_label, editorial_title, editorial_subtitle, editorial_image_url, expires_at, updated_at",
        )
        .in("offer_id", ids);

      if (curationError) throw curationError;

      const nextCurations = Object.fromEntries(
        ((curationData ?? []) as CurationRow[]).map((item) => [item.offer_id, item]),
      );
      setCurations(nextCurations);

      setSelectedOfferId((current) => {
        const next = current && ids.includes(current) ? current : ids[0];
        const existing = nextCurations[next];
        setDraft({ ...(existing ?? EMPTY_CURATION(next)) });
        return next;
      });
    } catch (error) {
      console.error("Failed to load offer curation:", error);
      toast.error("Não foi possível carregar as ofertas para curadoria.");
    } finally {
      setLoading(false);
    }
  }, [curationDb, search]);

  useEffect(() => {
    loadCollections().catch((error) => {
      console.error("Failed to load collections:", error);
      toast.error("Não foi possível carregar as coleções editoriais.");
    });
  }, [loadCollections]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const chooseOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
    setSelectedCollectionId("");
    setDraft({ ...(curations[offerId] ?? EMPTY_CURATION(offerId)) });
  };

  const saveCuration = async () => {
    if (!draft || !selectedOfferId) return;
    setSaving(true);
    try {
      const payload = {
        offer_id: selectedOfferId,
        is_hidden: draft.is_hidden,
        is_featured: draft.is_featured,
        sort_order: Number.isFinite(Number(draft.sort_order)) ? Number(draft.sort_order) : 0,
        campaign_label: draft.campaign_label,
        editorial_title: draft.editorial_title,
        editorial_subtitle: draft.editorial_subtitle,
        editorial_image_url: draft.editorial_image_url,
        expires_at: draft.expires_at,
      };

      const { data, error } = await curationDb
        .from("travel_offer_curation")
        .upsert(payload, { onConflict: "offer_id" })
        .select(
          "offer_id, is_hidden, is_featured, sort_order, campaign_label, editorial_title, editorial_subtitle, editorial_image_url, expires_at, updated_at",
        )
        .single();

      if (error) throw error;
      const saved = data as CurationRow;
      setCurations((current) => ({ ...current, [selectedOfferId]: saved }));
      setDraft({ ...saved });
      toast.success("Curadoria da oferta salva.");
    } catch (error) {
      console.error("Failed to save curation:", error);
      toast.error("Não foi possível salvar a curadoria.");
    } finally {
      setSaving(false);
    }
  };

  const removeCuration = async () => {
    if (!selectedOfferId || !curations[selectedOfferId]) return;
    if (!window.confirm("Remover toda a curadoria desta oferta e voltar ao conteúdo original do fornecedor?")) return;

    setSaving(true);
    try {
      const { error } = await curationDb
        .from("travel_offer_curation")
        .delete()
        .eq("offer_id", selectedOfferId);
      if (error) throw error;

      setCurations((current) => {
        const next = { ...current };
        delete next[selectedOfferId];
        return next;
      });
      setDraft(EMPTY_CURATION(selectedOfferId));
      toast.success("Curadoria removida.");
    } catch (error) {
      console.error("Failed to remove curation:", error);
      toast.error("Não foi possível remover a curadoria.");
    } finally {
      setSaving(false);
    }
  };

  const createCollection = async () => {
    const title = newCollectionTitle.trim();
    const slug = newCollectionSlug.trim().toLowerCase();
    if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast.error("Informe um título e um slug válido, como ferias-julho.");
      return;
    }

    setCreatingCollection(true);
    try {
      const { error } = await curationDb.from("travel_offer_collections").insert({
        title,
        slug,
        is_active: true,
        sort_order: 0,
      });
      if (error) throw error;
      setNewCollectionTitle("");
      setNewCollectionSlug("");
      await loadCollections();
      toast.success("Coleção criada.");
    } catch (error) {
      console.error("Failed to create collection:", error);
      toast.error("Não foi possível criar a coleção.");
    } finally {
      setCreatingCollection(false);
    }
  };

  const toggleCollection = async (collection: CollectionRow) => {
    try {
      const { error } = await curationDb
        .from("travel_offer_collections")
        .update({ is_active: !collection.is_active })
        .eq("id", collection.id);
      if (error) throw error;
      await loadCollections();
    } catch (error) {
      console.error("Failed to update collection:", error);
      toast.error("Não foi possível atualizar a coleção.");
    }
  };

  const addOfferToCollection = async () => {
    if (!selectedOfferId || !selectedCollectionId) return;
    try {
      const { error } = await curationDb.from("travel_offer_collection_items").upsert(
        {
          collection_id: selectedCollectionId,
          offer_id: selectedOfferId,
          sort_order: 0,
        },
        { onConflict: "collection_id,offer_id" },
      );
      if (error) throw error;
      toast.success("Oferta adicionada à coleção.");
    } catch (error) {
      console.error("Failed to add offer to collection:", error);
      toast.error("Não foi possível adicionar a oferta à coleção.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-black/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Sparkles className="h-5 w-5 text-primary" />
            Curadoria do Radar Tomorrow
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Edite somente a apresentação comercial. Os dados sincronizados do fornecedor permanecem intactos.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              loadOffers();
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por destino"
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 pl-10 pr-3 text-sm text-white outline-none focus:border-primary/60"
              />
            </div>
            <Button type="submit" disabled={loading}>Buscar</Button>
          </form>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
            <div className="max-h-[42rem] space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="h-32 animate-pulse rounded-xl bg-white/5" />
              ) : offers.length ? (
                offers.map((offer) => {
                  const curation = curations[offer.id];
                  const selected = offer.id === selectedOfferId;
                  return (
                    <button
                      key={offer.id}
                      type="button"
                      onClick={() => chooseOffer(offer.id)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        selected
                          ? "border-primary/70 bg-primary/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {offer.destination_name || offer.destination_iata || "Destino não informado"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{offerRoute(offer)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(offer.departure_date)} · {formatCurrency(offer.price_per_person, offer.currency)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {curation?.is_featured ? <Star className="h-4 w-4 text-yellow-400" /> : null}
                          {curation?.is_hidden ? <EyeOff className="h-4 w-4 text-red-400" /> : null}
                        </div>
                      </div>
                      {curation?.campaign_label ? (
                        <span className="mt-2 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
                          {curation.campaign_label}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className="rounded-xl border border-white/10 p-6 text-center text-sm text-muted-foreground">
                  Nenhuma oferta encontrada.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              {selectedOffer && draft ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Oferta selecionada</p>
                    <h3 className="mt-1 text-lg font-bold text-white">
                      {selectedOffer.destination_name || selectedOffer.destination_iata || "Destino não informado"}
                    </h3>
                    <p className="text-xs text-muted-foreground">{offerRoute(selectedOffer)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-lg border border-white/10 p-3 text-sm text-white">
                      <input
                        type="checkbox"
                        checked={draft.is_featured}
                        onChange={(event) => setDraft({ ...draft, is_featured: event.target.checked })}
                      />
                      <Star className="h-4 w-4" /> Destacar
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-white/10 p-3 text-sm text-white">
                      <input
                        type="checkbox"
                        checked={draft.is_hidden}
                        onChange={(event) => setDraft({ ...draft, is_hidden: event.target.checked })}
                      />
                      <EyeOff className="h-4 w-4" /> Ocultar
                    </label>
                  </div>

                  <label className="block text-xs font-medium text-muted-foreground">
                    Ordem editorial
                    <input
                      type="number"
                      value={draft.sort_order}
                      onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) })}
                      className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
                    />
                  </label>

                  <label className="block text-xs font-medium text-muted-foreground">
                    Campanha
                    <input
                      value={draft.campaign_label ?? ""}
                      maxLength={80}
                      onChange={(event) => setDraft({ ...draft, campaign_label: normalizeNullable(event.target.value) })}
                      placeholder="Ex.: Semana do Caribe"
                      className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
                    />
                  </label>

                  <label className="block text-xs font-medium text-muted-foreground">
                    Título editorial opcional
                    <input
                      value={draft.editorial_title ?? ""}
                      maxLength={160}
                      onChange={(event) => setDraft({ ...draft, editorial_title: normalizeNullable(event.target.value) })}
                      className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
                    />
                  </label>

                  <label className="block text-xs font-medium text-muted-foreground">
                    Subtítulo editorial opcional
                    <textarea
                      value={draft.editorial_subtitle ?? ""}
                      maxLength={320}
                      rows={3}
                      onChange={(event) => setDraft({ ...draft, editorial_subtitle: normalizeNullable(event.target.value) })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    />
                  </label>

                  <label className="block text-xs font-medium text-muted-foreground">
                    Imagem editorial opcional
                    <input
                      type="url"
                      value={draft.editorial_image_url ?? ""}
                      maxLength={2000}
                      onChange={(event) => setDraft({ ...draft, editorial_image_url: normalizeNullable(event.target.value) })}
                      placeholder="https://..."
                      className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
                    />
                  </label>

                  <label className="block text-xs font-medium text-muted-foreground">
                    Validade da curadoria
                    <input
                      type="datetime-local"
                      value={toDateTimeLocal(draft.expires_at)}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          expires_at: event.target.value ? new Date(event.target.value).toISOString() : null,
                        })
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
                    />
                  </label>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button onClick={saveCuration} disabled={saving}>
                      {saving ? "Salvando..." : "Salvar curadoria"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeCuration}
                      disabled={saving || !curations[selectedOfferId ?? ""]}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Remover override
                    </Button>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adicionar à coleção</p>
                    <div className="mt-2 flex gap-2">
                      <select
                        value={selectedCollectionId}
                        onChange={(event) => setSelectedCollectionId(event.target.value)}
                        className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
                      >
                        <option value="">Selecione</option>
                        {collections.filter((item) => item.is_active).map((collection) => (
                          <option key={collection.id} value={collection.id}>{collection.title}</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" onClick={addOfferToCollection} disabled={!selectedCollectionId}>
                        <BookmarkPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Selecione uma oferta para editar.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-black/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl text-white">Coleções editoriais</CardTitle>
          <p className="text-sm text-muted-foreground">Agrupe ofertas em campanhas sem alterar o inventário do fornecedor.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={newCollectionTitle}
              onChange={(event) => setNewCollectionTitle(event.target.value)}
              placeholder="Título da coleção"
              className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
            />
            <input
              value={newCollectionSlug}
              onChange={(event) => setNewCollectionSlug(event.target.value)}
              placeholder="slug-da-colecao"
              className="h-10 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
            />
            <Button onClick={createCollection} disabled={creatingCollection}>
              {creatingCollection ? "Criando..." : "Criar coleção"}
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {collections.map((collection) => (
              <div key={collection.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{collection.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">/{collection.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCollection(collection)}
                    className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold ${
                      collection.is_active ? "bg-green-500/15 text-green-300" : "bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {collection.is_active ? "Ativa" : "Inativa"}
                  </button>
                </div>
              </div>
            ))}
            {!collections.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma coleção criada ainda.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
