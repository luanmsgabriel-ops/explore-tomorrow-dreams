import { ChevronLeft, ChevronRight } from "lucide-react";

import { OpportunityButton } from "./OpportunityPrimitives";

interface OpportunityPaginationProps {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export function OpportunityPagination({ page, totalPages, disabled, onPageChange }: OpportunityPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="opportunity-scope flex flex-wrap items-center justify-center gap-3" aria-label="Paginação do catálogo">
      <OpportunityButton
        variant="outline"
        size="sm"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" />
        Anterior
      </OpportunityButton>
      <p className="min-w-28 text-center text-sm text-tomorrow-muted" aria-live="polite">
        Página <strong className="text-tomorrow-text">{page}</strong> de {totalPages}
      </p>
      <OpportunityButton
        variant="outline"
        size="sm"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
        <ChevronRight aria-hidden="true" />
      </OpportunityButton>
    </nav>
  );
}
