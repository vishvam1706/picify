'use client';

import { useState, useCallback } from 'react';
import { UploadCloud, X, LayoutGrid } from 'lucide-react';
import Image from 'next/image';

export default function ImageUploader({ onFilesSelected }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (newFiles) => {
    // Convert to array and filter out non-images
    const validFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    
    if (validFiles.length === 0) return;

    // Generate object URLs for preview
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    setFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    onFilesSelected([...files, ...validFiles]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [files, onFilesSelected]); // eslint-disable-line

  const handleRemove = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    onFilesSelected(newFiles);
  };

  return (
    <div className="w-full flex w-full flex-col gap-4">
      {previews.length > 0 ? (
        <div className="relative w-full aspect-[3/4] bg-muted rounded-3xl overflow-hidden group">
          <Image 
            src={previews[0]} 
            alt="Main Preview" 
            fill 
            className="object-contain bg-black/5" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
            <button 
              type="button"
              onClick={() => handleRemove(0)}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {previews.length > 1 && (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 text-white text-xs font-semibold">
              <LayoutGrid className="w-4 h-4" />
              1 of {previews.length}
            </div>
          )}
        </div>
      ) : (
        <label 
          className={`relative flex flex-col items-center justify-center w-full aspect-[3/4] bg-secondary/50 rounded-3xl border-2 border-dashed transition-all cursor-pointer hover:bg-secondary/80 ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm">
              <UploadCloud className="w-6 h-6 text-foreground" />
            </div>
            <p className="mb-2 text-sm font-semibold text-foreground">Choose a file or drag and drop it here</p>
            <p className="text-xs text-muted-foreground mt-4 text-center max-w-[200px]">
              We recommend using high quality .jpg files less than 20MB
            </p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/png, image/jpeg, image/webp, image/gif" 
            onChange={(e) => handleFiles(e.target.files)} 
          />
        </label>
      )}

      {/* Thumbnails row if multiple images */}
      {previews.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar">
          {previews.map((preview, idx) => (
            <div key={idx} className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-primary' : 'border-transparent'}`}>
              <Image src={preview} alt={`Thumb ${idx}`} fill className="object-cover" />
              <button 
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-destructive transition-colors"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="w-16 h-16 flex-shrink-0 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
            <UploadCloud className="w-5 h-5 text-muted-foreground" />
            <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        </div>
      )}
    </div>
  );
}
