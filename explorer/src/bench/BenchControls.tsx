import { FLIP_KEY } from './bindings';
export function BenchControls() {
  return (
    <div className="bench-menu-controls" aria-label="Controls">
      <section className="bench-control-group" aria-label="Move around">
        <dl>
          <div>
            <dt>
              <kbd>WASD</kbd>
            </dt>
            <dd>Move</dd>
          </div>
          <div>
            <dt>
              <kbd>Mouse</kbd>
            </dt>
            <dd>Look</dd>
          </div>
          <div>
            <dt>
              <kbd>Shift</kbd>
            </dt>
            <dd>Hold to run</dd>
          </div>
          <div>
            <dt>
              <kbd>Space</kbd>
            </dt>
            <dd>
              Hold to rise<small>Release to fall</small>
            </dd>
          </div>
        </dl>
      </section>
      <section className="bench-control-group" aria-label="At the bench">
        <dl>
          <div>
            <dt>
              <kbd>{FLIP_KEY.label}</kbd>
            </dt>
            <dd>Flip movement</dd>
          </div>
          <div>
            <dt>
              <kbd>R</kbd>
            </dt>
            <dd>Reset position</dd>
          </div>
          <div>
            <dt>
              <kbd>Esc</kbd>
            </dt>
            <dd>
              Menu<small>Release the pointer</small>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
