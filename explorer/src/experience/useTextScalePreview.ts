import { useLayoutEffect } from 'react';

/** Opt-in root text preview also reaches portaled panels; restore it on exit. */
export function useTextScalePreview() {
  useLayoutEffect(() => {
    if (new URLSearchParams(location.search).get('text') !== '200') return;
    const root = document.documentElement;
    const previousSize = root.style.fontSize;
    const previouslyEnlarged = root.classList.contains('text-enlarged');
    root.style.fontSize = '200%';
    root.classList.add('text-enlarged');
    return () => {
      root.style.fontSize = previousSize;
      root.classList.toggle('text-enlarged', previouslyEnlarged);
    };
  }, []);
}
