import React from 'react';
import { usePos } from '../context/PosContext';
import { KasaId } from '../types/pos';
import { ShoppingCart } from 'lucide-react';

const KASALAR: { id: KasaId; name: string; shortcut: string }[] = [
  { id: 1, name: 'Kasa 1', shortcut: 'F1' },
  { id: 2, name: 'Kasa 2', shortcut: 'F2' },
  { id: 3, name: 'Kasa 3', shortcut: 'F3' },
  { id: 4, name: 'Kasa 4', shortcut: 'F4' },
  { id: 5, name: 'Kasa 5', shortcut: 'F5' },
];

export const KasaTabs: React.FC = () => {
  const { activeKasa, setActiveKasa, kasas } = usePos();

  return (
    <div className="bg-white border-b border-gray-200 px-2 sm:px-3 py-1.5 flex items-center shadow-2xs shrink-0 overflow-x-auto scrollbar-none">
      <div className="flex items-center space-x-1.5 sm:space-x-2 w-full min-w-max sm:min-w-0">
        {KASALAR.map((kasa) => {
          const isActive = activeKasa === kasa.id;
          const kasaData = kasas[kasa.id];
          const itemCount = kasaData?.items?.reduce((acc, it) => acc + it.quantity, 0) || 0;
          const hasItems = itemCount > 0;

          return (
            <button
              key={kasa.id}
              type="button"
              onClick={() => setActiveKasa(kasa.id)}
              className={`flex-1 min-w-[72px] sm:min-w-0 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer relative text-xs sm:text-sm shrink-0 sm:shrink ${
                isActive
                  ? 'bg-zeytin-700 text-white shadow-sm ring-2 ring-zeytin-500 scale-[1.01]'
                  : hasItems
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-1">
                <span className="font-extrabold whitespace-nowrap">{kasa.name}</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold hidden sm:inline-block ${
                  isActive ? 'bg-zeytin-800 text-zeytin-200' : 'bg-gray-200 text-gray-600'
                }`}>
                  {kasa.shortcut}
                </span>
              </div>

              {hasItems && (
                <span className={`flex items-center space-x-0.5 text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive
                    ? 'bg-white text-zeytin-900'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}>
                  <ShoppingCart className="w-2.5 h-2.5" />
                  <span>{itemCount}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
