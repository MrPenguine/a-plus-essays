import { useEffect, useState } from 'react';

export const useScript = (src: string): boolean => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    const handleLoad = () => setLoaded(true);
    const handleError = () => {
      script.remove();
      setLoaded(false);
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [src]);

  return loaded;
}; 