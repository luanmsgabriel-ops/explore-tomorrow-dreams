import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DeferredOfferImage } from './DeferredOfferImage';

describe('DeferredOfferImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('carrega imediatamente quando marcado como eager', () => {
    render(<DeferredOfferImage src="https://example.com/card.webp" alt="Oferta" eager />);

    const image = screen.getByRole('img', { name: 'Oferta' });
    expect(image).toHaveAttribute('src', 'https://example.com/card.webp');
    expect(image).toHaveAttribute('loading', 'eager');
  });

  it('usa a margem configurada para antecipar o carregamento lazy', () => {
    let receivedOptions: IntersectionObserverInit | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();

    class MockIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: readonly number[] = [];
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
      takeRecords = vi.fn(() => []);

      constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        receivedOptions = options;
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as unknown as typeof IntersectionObserver);

    render(
      <DeferredOfferImage
        src="https://example.com/card.webp"
        alt="Oferta"
        preloadMargin="900px 0px"
      />,
    );

    expect(receivedOptions).toEqual({ rootMargin: '900px 0px' });
    expect(observe).toHaveBeenCalledTimes(1);
  });
});
