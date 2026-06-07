import { useRef, useState } from 'react';

export default function BarcodeInput({ disabled, onSubmit }) {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = barcode.trim();

    if (!value) return;

    onSubmit(value);
    setBarcode('');
    inputRef.current?.focus();
  };

  return (
    <form className="barcode-form" onSubmit={handleSubmit}>
      <label htmlFor="barcode">
        Barkod Okutma
        <input
          ref={inputRef}
          id="barcode"
          autoFocus
          value={barcode}
          disabled={disabled}
          placeholder="Barkod okutun, ürün otomatik sepete eklensin"
          onChange={(event) => setBarcode(event.target.value)}
        />
      </label>
    </form>
  );
}
