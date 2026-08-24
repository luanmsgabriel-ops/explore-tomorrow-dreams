import type { ChangeEvent, FormEvent } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";

import type { PublicOfferSubtype, TravelOffersFacets } from "@/lib/travelOffersPublic";
import type { CatalogFilterErrors, CatalogFilterValues } from "./catalogFilterState";
import { OpportunityButton, OpportunityField } from "./OpportunityPrimitives";

const selectClassName =
  "opportunity-focus min-h-11 w-full rounded-tomorrow border border-tomorrow-line bg-tomorrow-surface/88 px-3 py-2 text-base text-tomorrow-text disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const fieldLabelClassName = "grid gap-2 text-sm font-semibold text-tomorrow-text";

const packageSubtypeOptions: Array<{ value: PublicOfferSubtype; label: string }> = [
  { value: "nacional", label: "Pacote nacional" },
  { value: "internacional", label: "Pacote internacional" },
  { value: "evento", label: "Evento" },
  { value: "grupo_guiado", label: "Grupo guiado" },
];

interface OpportunityFiltersProps {
  values: CatalogFilterValues;
  facets?: TravelOffersFacets;
  errors?: CatalogFilterErrors;
  disabled?: boolean;
  onChange: (values: CatalogFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
}

export function OpportunityFilters({
  values,
  facets,
  errors = {},
  disabled,
  onChange,
  onApply,
  onClear,
}: OpportunityFiltersProps) {
  const setText = (field: keyof CatalogFilterValues) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...values, [field]: event.target.value });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onApply();
  };

  const subtypeOptions = values.offerType === "bloqueio_aereo"
    ? [{ value: "bloqueio" as const, label: "Bloqueio aéreo" }]
    : values.offerType === "pacote"
      ? packageSubtypeOptions
      : [{ value: "bloqueio" as const, label: "Bloqueio aéreo" }, ...packageSubtypeOptions];

  return (
    <form
      className="opportunity-surface grid gap-5 rounded-tomorrow-lg border border-tomorrow-line bg-tomorrow-surface/75 p-4 shadow-tomorrow-surface sm:p-6"
      onSubmit={submit}
      aria-label="Filtros do catálogo"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-tomorrow-teal/10 text-tomorrow-teal-soft">
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-editorial text-2xl text-tomorrow-text">Refine sua busca</h2>
            <p className="text-xs text-tomorrow-muted">Escolha o tipo primeiro; origem e destino mostram apenas combinações válidas.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className={fieldLabelClassName}>
          Tipo de oferta
          <select className={selectClassName} value={values.offerType} onChange={setText("offerType")} disabled={disabled}>
            <option value="">Aéreo e pacotes</option>
            <option value="bloqueio_aereo">Bloqueio aéreo</option>
            <option value="pacote">Pacote</option>
          </select>
        </label>
        <label className={fieldLabelClassName}>
          Origem
          <select className={selectClassName} value={values.origin} onChange={setText("origin")} disabled={disabled}>
            <option value="">Todas as origens</option>
            {facets?.origins.map((item) => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}
          </select>
        </label>
        <label className={fieldLabelClassName}>
          Destino
          <select
            className={selectClassName}
            value={values.destination}
            onChange={setText("destination")}
            disabled={disabled || !values.origin}
          >
            <option value="">{values.origin ? "Todos os destinos" : "Selecione a origem primeiro"}</option>
            {facets?.destinations.map((item) => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}
          </select>
        </label>
        <label className={fieldLabelClassName}>
          Subtipo
          <select className={selectClassName} value={values.subtype} onChange={setText("subtype")} disabled={disabled}>
            <option value="">Todos os subtipos</option>
            {subtypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <OpportunityField
        label="Buscar por nome ou palavra-chave"
        value={values.search}
        onChange={setText("search")}
        placeholder="Ex.: resort, neve, Beto Carrero"
        maxLength={80}
        leadingIcon={<Search className="size-4" />}
        error={errors.search}
        disabled={disabled}
      />

      <div className="grid gap-4 border-t border-tomorrow-line pt-5 sm:grid-cols-2 xl:grid-cols-4">
        {values.offerType !== "bloqueio_aereo" ? (
          <label className={fieldLabelClassName}>
            Categoria
            <select className={selectClassName} value={values.category} onChange={setText("category")} disabled={disabled}>
              <option value="">Todas as categorias</option>
              {facets?.categories.map((item) => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}
            </select>
          </label>
        ) : null}
        <OpportunityField
          label="Data inicial"
          type="date"
          value={values.startDate}
          min={facets?.date_range.min ?? undefined}
          max={facets?.date_range.max ?? undefined}
          onChange={setText("startDate")}
          disabled={disabled}
        />
        <OpportunityField
          label="Data final"
          type="date"
          value={values.endDate}
          min={values.startDate || facets?.date_range.min || undefined}
          max={facets?.date_range.max ?? undefined}
          onChange={setText("endDate")}
          error={errors.endDate}
          disabled={disabled}
        />
        <OpportunityField
          label="Passageiros"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={values.passengers}
          onChange={setText("passengers")}
          placeholder="Ex.: 2"
          error={errors.passengers}
          disabled={disabled}
        />
        <OpportunityField
          label="Preço mínimo por pessoa"
          type="number"
          inputMode="decimal"
          min={0}
          max={1_000_000}
          step="0.01"
          value={values.minPrice}
          onChange={setText("minPrice")}
          placeholder="R$ 0"
          error={errors.minPrice}
          disabled={disabled}
        />
        <OpportunityField
          label="Preço máximo por pessoa"
          type="number"
          inputMode="decimal"
          min={0}
          max={1_000_000}
          step="0.01"
          value={values.maxPrice}
          onChange={setText("maxPrice")}
          placeholder="Sem limite"
          error={errors.maxPrice}
          disabled={disabled}
        />
        <label className={fieldLabelClassName}>
          Ordenar por
          <select className={selectClassName} value={values.sort} onChange={setText("sort")} disabled={disabled}>
            <option value="date_asc">Data mais próxima</option>
            <option value="date_desc">Data mais distante</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="updated_desc">Atualização mais recente</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-3 self-end rounded-tomorrow border border-tomorrow-line bg-tomorrow-surface/88 px-3 py-2 text-sm text-tomorrow-text">
          <input
            type="checkbox"
            checked={values.onlyWithSeats}
            onChange={(event) => onChange({ ...values, onlyWithSeats: event.target.checked })}
            className="size-4 accent-[hsl(var(--op-teal))]"
            disabled={disabled}
          />
          Somente com vagas informadas
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-tomorrow-line pt-5 sm:flex-row sm:justify-end">
        <OpportunityButton type="button" variant="ghost" onClick={onClear} disabled={disabled}>
          Limpar filtros
        </OpportunityButton>
        <OpportunityButton type="submit" disabled={disabled}>
          <Filter className="size-4" aria-hidden="true" />
          Aplicar filtros
        </OpportunityButton>
      </div>
    </form>
  );
}
