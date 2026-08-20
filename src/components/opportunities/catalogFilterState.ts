import type {
  CatalogParams,
  CatalogSort,
  PublicOfferSubtype,
  PublicOfferType,
} from "@/lib/travelOffersPublic";

export interface CatalogFilterValues {
  search: string;
  origin: string;
  destination: string;
  offerType: "" | PublicOfferType;
  subtype: "" | PublicOfferSubtype;
  category: string;
  startDate: string;
  endDate: string;
  passengers: string;
  minPrice: string;
  maxPrice: string;
  onlyWithSeats: boolean;
  sort: CatalogSort;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilterValues = {
  search: "",
  origin: "",
  destination: "",
  offerType: "",
  subtype: "",
  category: "",
  startDate: "",
  endDate: "",
  passengers: "",
  minPrice: "",
  maxPrice: "",
  onlyWithSeats: false,
  sort: "date_asc",
};

export type CatalogFilterErrors = Partial<Record<keyof CatalogFilterValues, string>>;

function numericValue(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function validateCatalogFilters(values: CatalogFilterValues): CatalogFilterErrors {
  const errors: CatalogFilterErrors = {};
  const search = values.search.trim();
  if (search.length > 80 || (search && !/^[\p{L}\p{N}\s-]+$/u.test(search))) {
    errors.search = "Use até 80 caracteres, sem símbolos especiais.";
  }

  if (values.startDate && values.endDate) {
    const start = new Date(`${values.startDate}T00:00:00Z`).getTime();
    const end = new Date(`${values.endDate}T00:00:00Z`).getTime();
    const days = (end - start) / 86_400_000;
    if (days < 0) errors.endDate = "A data final deve ser igual ou posterior à inicial.";
    else if (days > 730) errors.endDate = "O período não pode exceder 730 dias.";
  }

  const passengers = numericValue(values.passengers);
  if (values.passengers && (!Number.isInteger(passengers) || (passengers ?? 0) < 1 || (passengers ?? 0) > 20)) {
    errors.passengers = "Informe de 1 a 20 passageiros.";
  }

  const minPrice = numericValue(values.minPrice);
  const maxPrice = numericValue(values.maxPrice);
  if (values.minPrice && (minPrice === undefined || minPrice < 0 || minPrice > 1_000_000)) {
    errors.minPrice = "Informe um valor entre 0 e 1.000.000.";
  }
  if (values.maxPrice && (maxPrice === undefined || maxPrice < 0 || maxPrice > 1_000_000)) {
    errors.maxPrice = "Informe um valor entre 0 e 1.000.000.";
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    errors.maxPrice = "O valor máximo deve ser igual ou maior que o mínimo.";
  }

  return errors;
}

export function catalogParamsFromFilters(
  values: CatalogFilterValues,
  page: number,
  perPage = 18,
): CatalogParams {
  const params: CatalogParams = { sort: values.sort, page, per_page: perPage };
  const assignText = (key: keyof CatalogParams, value: string) => {
    const normalized = value.trim();
    if (normalized) Object.assign(params, { [key]: normalized });
  };

  assignText("search", values.search);
  assignText("origin", values.origin);
  assignText("destination", values.destination);
  assignText("category", values.category);
  assignText("start_date", values.startDate);
  assignText("end_date", values.endDate);
  if (values.offerType) params.offer_type = values.offerType;
  if (values.subtype) params.subtype = values.subtype;
  const passengers = numericValue(values.passengers);
  const minPrice = numericValue(values.minPrice);
  const maxPrice = numericValue(values.maxPrice);
  if (passengers !== undefined) params.passengers = passengers;
  if (minPrice !== undefined) params.min_price = minPrice;
  if (maxPrice !== undefined) params.max_price = maxPrice;
  if (values.onlyWithSeats) params.only_with_seats = true;
  return params;
}
