import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminDashboardErrorBoundary } from './AdminDashboardErrorBoundary';

const BrokenDashboard = () => {
  throw new Error('render failed');
};

describe('AdminDashboardErrorBoundary', () => {
  it('keeps a recovery screen visible when the dashboard render fails', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AdminDashboardErrorBoundary>
        <BrokenDashboard />
      </AdminDashboardErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Não foi possível exibir o painel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recarregar painel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao acesso' })).toHaveAttribute('href', '/admin');

    consoleError.mockRestore();
  });
});
