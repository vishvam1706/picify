import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ColorPaletteDisplay({ dominantColor, palette = [] }) {
  const [copied, setCopied] = useState(null);

  const handleCopy = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!dominantColor && (!palette || palette.length === 0)) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Color Palette</h3>
      
      <div className="flex flex-wrap gap-3">
        {/* Dominant Color (larger) */}
        {dominantColor && (
          <div 
            className="group relative w-16 h-16 rounded-full cursor-pointer shadow-sm border border-black/5 hover:scale-110 transition-transform"
            style={{ backgroundColor: dominantColor }}
            onClick={() => handleCopy(dominantColor)}
            title={`Copy ${dominantColor}`}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
              {copied === dominantColor ? <Check className="w-5 h-5 text-white drop-shadow-md" /> : <Copy className="w-5 h-5 text-white drop-shadow-md" />}
            </div>
          </div>
        )}

        {/* Supporting Palette Colors */}
        {palette.map((color, i) => (
          <div 
            key={i}
            className="group relative w-12 h-12 rounded-full cursor-pointer shadow-sm border border-black/5 hover:scale-110 transition-transform mt-2"
            style={{ backgroundColor: color }}
            onClick={() => handleCopy(color)}
            title={`Copy ${color}`}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
              {copied === color ? <Check className="w-4 h-4 text-white drop-shadow-md" /> : <Copy className="w-4 h-4 text-white drop-shadow-md" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
