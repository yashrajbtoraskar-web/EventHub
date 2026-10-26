import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

/** <img> with a graceful gradient fallback if the URL fails to load. */
export default function EventImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt || 'No image available'}>
        <ImageOff size={28} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
