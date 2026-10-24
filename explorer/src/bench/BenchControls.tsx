import { FLIP_KEY } from './bindings';
export function BenchControls() {
  return (
    <div className="bench-menu-controls" aria-label="Controls">
      <span>
        <kbd>WASD</kbd> Move
      </span>
      <span>
        <kbd>Mouse</kbd> Look
      </span>
      <span className="bench-thrust">
        <kbd>Space</kbd> Hold to rise · Release to fall
      </span>
      <span>
        <kbd>{FLIP_KEY.label}</kbd> Flip movement
      </span>
      <span>
        <kbd>R</kbd> Reset position
      </span>
      <span>
        <kbd>Esc</kbd> Menu
      </span>
    </div>
  );
}
