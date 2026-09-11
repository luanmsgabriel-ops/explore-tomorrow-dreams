import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTravelOfferCatalog } from '@/lib/travelOffersPublic';
import { HomeOpportunityShowcase } from './HomeOpportunityShowcase';

vi.mock('@/lib/travelOffersPublic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/travelOffersPublic')>();
  return { ...actual, fetchTravelOfferCatalog: vi.fn() };
});

const mockedFetchCatalog = vi.mocked(fetchTravelOfferCatalog);

function renderShowcase() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomeOpportunityShowcase />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomeOpportunityShowcase', () => {
  beforeEach(() => mockedFetchCatalog.mockReset());

  it('consulta somente a camada pública e apresenta os dados retornados', async () => {
    mockedFetchCatalog.mockResolvedValue({
      items: [{
        kind: 'package',
        id: '11111111-1111-4111-8111-111111111111',
        offer_type: 'pacote',
        offer_subtype: 'nacional',
        name: 'Gramado com experiências',
        category: 'Pacote nacional',
        origin: 'São Paulo',
        origin_iata: 'CGH',
        destination: 'Gramado',
        destination_iata: 'POA',
        departure_date: '2027-01-30',
        return_date: '2027-02-03',
        nights: 4,
        airline: null,
        price_per_person: 1510,
        tax_per_person: 210,
        currency: 'BRL',
        available_seats: null,
        airfare_included: true,
        image_url: null,
        featured: true,
        editorial_order: 1,
        campaign_label: null,
        editorial_subtitle: null,
        updated_at: '2026-09-11T00:00:00Z',
      }],
      page: 1,
      per_page: 6,
      total: 1,
      total_pages: 1,
      applied_filters: { offer_type: 'pacote' },
      updated_at: '2026-09-11T00:00:00Z',
      notice: 'Disponibilidade sujeita à confirmação.',
    });

    renderShowcase();

    expect(await screen.findByRole('heading', { name: 'Gramado com experiências' })).toBeInTheDocument();
    expect(screen.getByText('São Paulo (CGH) → Gramado (POA)')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.510,00')).toBeInTheDocument();
    expect(screen.getByText('Disponibilidade sujeita à confirmação.')).toBeInTheDocument();
    expect(mockedFetchCatalog).toHaveBeenCalledWith({
      offer_type: 'pacote',
      sort: 'editorial',
      page: 1,
      per_page: 6,
    }, expect.any(AbortSignal));
  });

  it('mantém acesso ao catálogo quando a vitrine está vazia', async () => {
    mockedFetchCatalog.mockResolvedValue({
      items: [],
      page: 1,
      per_page: 6,
      total: 0,
      total_pages: 0,
      applied_filters: { offer_type: 'pacote' },
      updated_at: '2026-09-11T00:00:00Z',
      notice: 'Disponibilidade sujeita à confirmação.',
    });
    renderShowcase();

    expect(await screen.findByRole('heading', { name: 'Nenhum pacote disponível nesta vitrine' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /catálogo/i })).not.toHaveLength(0);
  });
});
