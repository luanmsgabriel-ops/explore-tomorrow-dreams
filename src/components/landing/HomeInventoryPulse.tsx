import { useQuery } from '@tanstack/react-query';
import { PackageOpen, Plane, Radio } from 'lucide-react';

import { fetchTravelOfferFacets } from '@/lib/travelOffersPublic';

const numberFormatter = new Intl.NumberFormat('pt-BR');

function facetCount(
  offerTypes: Array<{ value: string; count: number }> | undefined,
  value: string,
) {
  return offerTypes?.find((facet) => facet.value === value)?.count;
}

export function HomeInventoryPulse() {
  const facetsQuery = useQuery({
    queryKey: ['travel-offers-public', 'home-inventory-pulse'],
    queryFn: ({ signal }) => fetchTravelOfferFacets(signal),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: 1_000,
  });

  const packageCount = facetCount(facetsQuery.data?.offer_types, 'pacote');
  const airBlockCount = facetCount(facetsQuery.data?.offer_types, 'bloqueio_aereo');
  const hasCounts = packageCount !== undefined || airBlockCount !== undefined;

  return (
    <div className="w-full max-w-2xl" aria-live="polite">
      <div className="mb-3 flex items-center justify-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-teal-light">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-teal-light" />
        </span>
        Radar atualizado automaticamente
      </div>

      {facetsQuery.isPending ? (
        <div className="flex min-h-20 items-center justify-center gap-3 rounded-2xl border border-white/15 bg-ocean-deep/55 px-5 text-sm text-white/65 backdrop-blur-xl">
          <Radio className="size-4 animate-pulse text-gold-light" aria-hidden="true" />
          Consultando o inventário agora…
        </div>
      ) : null}

      {hasCounts ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/15 bg-ocean-deep/65 px-4 py-4 text-left shadow-xl backdrop-blur-xl sm:px-6">
            <PackageOpen className="mb-2 size-5 text-gold-light" aria-hidden="true" />
            <strong className="block font-editorial text-3xl leading-none text-white sm:text-4xl">
              {numberFormatter.format(packageCount ?? 0)}
            </strong>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              pacotes no radar
            </span>
          </div>
          <div className="rounded-2xl border border-white/15 bg-ocean-deep/65 px-4 py-4 text-left shadow-xl backdrop-blur-xl sm:px-6">
            <Plane className="mb-2 size-5 text-teal-light" aria-hidden="true" />
            <strong className="block font-editorial text-3xl leading-none text-white sm:text-4xl">
              {numberFormatter.format(airBlockCount ?? 0)}
            </strong>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              bloqueios aéreos
            </span>
          </div>
        </div>
      ) : null}

      {facetsQuery.isError ? (
        <p className="rounded-2xl border border-white/15 bg-ocean-deep/55 px-5 py-4 text-center text-sm text-white/65 backdrop-blur-xl">
          Consulte as oportunidades disponíveis no catálogo.
        </p>
      ) : null}
    </div>
  );
}
