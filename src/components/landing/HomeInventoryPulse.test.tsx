import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTravelOfferFacets } from '@/lib/travelOffersPublic';
import { HomeInventoryPulse } from './HomeInventoryPulse';

vi.mock('@/lib/travelOffersPublic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/travelOffersPublic')>();
  return { ...actual, fetchTravelOfferFacets: vi.fn() };
});

const mockedFetchFacets = vi.mocked(fetchTravelOfferFacets);

function renderPulse() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <HomeInventoryPulse />
    </QueryClientProvider>,
  );
}

describe('HomeInventoryPulse', () => {
  beforeEach(() => mockedFetchFacets.mockReset());

  it('exibe as quantidades públicas de pacotes e bloqueios', async () => {
    mockedFetchFacets.mockResolvedValue({
      offer_types: [
        { value: 'pacote', count: 402 },
        { value: 'bloqueio_aereo', count: 10003 },
      ],
      subtypes: [],
      origins: [],
      origin_airports: [],
      destinations: [],
      destination_airports: [],
      categories: [],
      date_range: { min: null, max: null },
      price_ranges: [],
      updated_at: '2026-09-11T00:00:00Z',
      notice: 'Disponibilidade sujeita à confirmação.',
    });

    renderPulse();

    expect(await screen.findByText('402')).toBeInTheDocument();
    expect(screen.getByText('10.003')).toBeInTheDocument();
    expect(screen.getByText('pacotes no radar')).toBeInTheDocument();
    expect(screen.getByText('bloqueios aéreos')).toBeInTheDocument();
    expect(mockedFetchFacets).toHaveBeenCalledWith(expect.any(AbortSignal));
  });
});
