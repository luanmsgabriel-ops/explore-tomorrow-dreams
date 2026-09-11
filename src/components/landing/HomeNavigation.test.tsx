import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { RadarAccess } from './RadarAccess';

describe('navegação pública para o Radar Tomorrow', () => {
  it('expõe oportunidades e calendário no cabeçalho sem promover a rota legada', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: 'Oportunidades' })[0]).toHaveAttribute('href', '/oportunidades/catalogo');
    expect(screen.getAllByRole('link', { name: 'Calendário' })[0]).toHaveAttribute('href', '/oportunidades/calendario');
    expect(screen.queryByRole('link', { name: 'Ofertas' })).not.toBeInTheDocument();
  });

  it('oferece catálogo, calendário, Live e comparação na nova Home', () => {
    render(
      <MemoryRouter>
        <RadarAccess />
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: /Abrir catálogo/i })[0]).toHaveAttribute('href', '/oportunidades/catalogo');
    expect(screen.getAllByRole('link', { name: /Consultar calendário/i })[0]).toHaveAttribute('href', '/oportunidades/calendario');
    expect(screen.getAllByRole('link', { name: /Entrar no Live/i })[0]).toHaveAttribute('href', '/oportunidades/live');
    expect(screen.getAllByRole('link', { name: /Comparar/i })[0]).toHaveAttribute('href', '/oportunidades/comparar');
  });
});
