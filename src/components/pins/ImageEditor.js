import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Crop, Sparkles, X, Check, Sun, Contrast, Droplet, RotateCcw } from 'lucide-react';

export default function ImageEditor({ imageUrl, onSave, onCancel }) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      renderImage();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const renderImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!img || !canvas) return;

    // Set canvas dimensions based on rotation
    if (rotation % 180 !== 0) {
      canvas.width = img.height;
      canvas.height = img.width;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  useEffect(() => {
    renderImage();
  }, [brightness, contrast, saturation, rotation]);

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    onSave(dataUrl);
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]">
        
        {/* Preview Area */}
        <div className="flex-1 bg-secondary/30 flex items-center justify-center p-8 relative overflow-hidden">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-full object-contain shadow-md rounded-lg"
          />
        </div>

        {/* Tools Area */}
        <div className="w-full md:w-80 bg-background border-l border-border p-6 flex flex-col gap-8 overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Edit Image</h2>
            <p className="text-sm text-muted-foreground mt-1">Adjust filters and rotate the image before uploading</p>
          </div>

          <div className="space-y-6 flex-1">
            {/* Brightness */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-semibold">
                <span className="flex items-center gap-2"><Sun className="w-4 h-4"/> Brightness</span>
                <span className="text-muted-foreground">{brightness}%</span>
              </label>
              <input 
                type="range" min="0" max="200" value={brightness} 
                onChange={(e) => setBrightness(e.target.value)}
                className="w-full accent-primary"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-semibold">
                <span className="flex items-center gap-2"><Contrast className="w-4 h-4"/> Contrast</span>
                <span className="text-muted-foreground">{contrast}%</span>
              </label>
              <input 
                type="range" min="0" max="200" value={contrast} 
                onChange={(e) => setContrast(e.target.value)}
                className="w-full accent-primary"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-semibold">
                <span className="flex items-center gap-2"><Droplet className="w-4 h-4"/> Saturation</span>
                <span className="text-muted-foreground">{saturation}%</span>
              </label>
              <input 
                type="range" min="0" max="200" value={saturation} 
                onChange={(e) => setSaturation(e.target.value)}
                className="w-full accent-primary"
              />
            </div>

            <div className="pt-4 border-t border-border grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setRotation(r => r - 90)} className="w-full">
                <Crop className="w-4 h-4 mr-2" /> Rotate L
              </Button>
              <Button variant="secondary" onClick={() => setRotation(r => r + 90)} className="w-full">
                <Crop className="w-4 h-4 mr-2" /> Rotate R
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col gap-3">
            <Button onClick={handleSave} className="w-full py-6 rounded-xl font-bold text-base">
              <Check className="w-5 h-5 mr-2" /> Apply Changes
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleReset} className="flex-1 rounded-xl">
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
              <Button variant="destructive" onClick={onCancel} className="flex-1 rounded-xl">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
