import Image from 'next/image';

interface CustomImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function CustomImage({ src, alt, className }: CustomImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={0}
      height={0}
      sizes="100vw"
      className={`w-auto h-auto ${className}`}
      style={{
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  );
} 