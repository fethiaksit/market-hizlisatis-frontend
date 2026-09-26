// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AuthProvider } from '../context/AuthContext';
import { PosProvider } from '../context/PosContext';
import { PosView } from './PosView';

describe('PosView uygulama bilgisi', () => {
  beforeEach(() => {
    localStorage.setItem('zeytin_pos_token', 'test-token');
    localStorage.setItem(
      'zeytin_pos_active_cashier',
      JSON.stringify({ id: '1', name: 'Test Kasiyer', username: 'test', role: 'cashier' }),
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('ana kısayol kartı yerine açılıp kapanabilen sade bilgi penceresi gösterir', () => {
    render(
      <AuthProvider>
        <PosProvider>
          <PosView />
        </PosProvider>
      </AuthProvider>,
    );

    expect(screen.queryByText('Klavye Kısayolları', { selector: 'span' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Uygulama hakkında' }));

    expect(screen.getByRole('dialog', { name: 'ZeytinERP Hızlı Satış' })).toBeInTheDocument();
    expect(screen.getByText('Barkod ile ürün ekleme')).toBeInTheDocument();
    expect(screen.queryByText('F1 - F5')).not.toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /klavye kısayolları/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kapat' }));
    expect(screen.queryByRole('dialog', { name: 'ZeytinERP Hızlı Satış' })).not.toBeInTheDocument();
  });
});
