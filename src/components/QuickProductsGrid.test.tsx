// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QuickProductsGrid } from './QuickProductsGrid';
import { usePos } from '../context/PosContext';
import type { Product } from '../types/pos';

vi.mock('../context/PosContext', () => ({ usePos: vi.fn() }));

const favorite: Product = {
  id: 1,
  barcode: '8690000000001',
  name: 'Ülker Gofret',
  price: 25,
  stock: 8,
  unit: 'Adet',
  isQuickProduct: true,
  imageUrl: '/uploads/gofret.jpg',
  isActive: true,
};

const outOfStockFavorite: Product = {
  ...favorite,
  id: 2,
  name: 'Su',
  price: 10,
  stock: 0,
  imageUrl: '/uploads/su.jpg',
};

describe('QuickProductsGrid', () => {
  const addToCart = vi.fn();
  const showToast = vi.fn();

  beforeEach(() => {
    vi.mocked(usePos).mockReturnValue({
      quickProducts: [favorite, outOfStockFavorite],
      addToCart,
      showToast,
    } as ReturnType<typeof usePos>);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders image-first favorite cards and delegates each in-stock press to the cart', () => {
    render(<QuickProductsGrid />);

    const image = screen.getByRole('img', { name: 'Ülker Gofret' });
    expect(image).toHaveAttribute('src', '/uploads/gofret.jpg');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('₺25,00')).toBeInTheDocument();

    const card = screen.getByRole('button', { name: /ülker gofret/i });
    fireEvent.click(card);
    fireEvent.click(card);

    expect(addToCart).toHaveBeenCalledTimes(2);
    expect(addToCart).toHaveBeenLastCalledWith(favorite, 1);
  });

  it('keeps an out-of-stock favorite visible but prevents adding it to the cart', () => {
    render(<QuickProductsGrid />);

    fireEvent.click(screen.getByRole('button', { name: /su/i }));

    expect(addToCart).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Ürün stokta yok.', 'error');
  });

  it('shows the configured empty state instead of shortcut cards', () => {
    vi.mocked(usePos).mockReturnValue({
      quickProducts: [],
      addToCart,
      showToast,
    } as ReturnType<typeof usePos>);

    render(<QuickProductsGrid />);

    expect(screen.getByText('Henüz favori ürün eklenmemiş.')).toBeInTheDocument();
  });
});
