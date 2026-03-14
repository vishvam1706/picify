import Image from 'next/image';

export default function Avatar({ src, alt = "Avatar", size = "md", className = "" }) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    xxl: "w-32 h-32"
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative ${currentSize} rounded-full overflow-hidden bg-muted flex-shrink-0 ${className}`}>
      {src ? (
        <Image 
          src={src} 
          alt={alt} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground font-semibold uppercase text-sm">
          {alt.charAt(0)}
        </div>
      )}
    </div>
  );
}
