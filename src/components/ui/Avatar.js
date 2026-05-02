import Image from 'next/image';

export default function Avatar({ src, alt = "Avatar", size = "md", className = "" }) {
  const sizeMap = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
    xxl: "w-28 h-28"
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
