import type { MovementViewer } from '../viewer/MovementViewer';
import { DIALS, type DialView, type DialFace } from './dials';
import { GROUPS } from './catalog';
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};
export function registerMovementTools(viewer: MovementViewer) {
  const context = (
    document as Document & {
      modelContext?: {
        registerTool: (
          tool: Tool,
          options: { signal: AbortSignal },
        ) => void | Promise<void>;
      };
    }
  ).modelContext;
  if (!context) return () => {};
  const lifetime = new AbortController();
  const state = () => {
    const s = viewer.snapshot();
    return {
      ready: s.ready,
      layout: s.layout,
      presentation: s.presentation,
      centralStyle: s.centralStyle,
      smallStyle: s.smallStyle,
      dialRequest: s.dialRequest,
      dialError: s.dialError,
      isolated: s.isolated,
      canBack: s.canBack,
      group: s.group,
      part: s.part,
      separation: s.separation,
      partSpread: s.partSpread,
      reveal: s.reveal,
      side: s.side,
      treatment: s.treatment,
      error: s.error,
      stats: s.stats,
    };
  };
  const settle = async () => {
    await new Promise<void>((resolve) => {
      let frames = 0;
      const tick = () => {
        if (
          viewer.dead ||
          lifetime.signal.aborted ||
          (!viewer.travel &&
            !viewer.presentationMoving &&
            !viewer.needsRender &&
            frames > 3) ||
          frames > 300
        ) {
          resolve();
          return;
        }
        frames++;
        requestAnimationFrame(tick);
      };
      tick();
    });
    return state();
  };
  const tools: Tool[] = [
    {
      name: 'configure_dials',
      description:
        'Show Movement, Central dial or Small dial; fit both reviewed displays, remembering independent hand styles.',
      inputSchema: {
        type: 'object',
        properties: {
          view: { type: 'string', enum: ['movement', 'central', 'small'] },
          face: { type: 'string', enum: ['central', 'small'] },
          style: {
            type: 'string',
            enum: [
              ...new Set(
                [
                  ...DIALS.faces.central.styles,
                  ...DIALS.faces.small.styles,
                ].map((s) => s.id),
              ),
            ],
          },
        },
        required: ['view'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input) => {
        const { view, face, style } = input as {
          view: DialView;
          face?: DialFace;
          style?: string;
        };
        if (
          !['movement', 'central', 'small'].includes(view) ||
          (face && !['central', 'small'].includes(face))
        )
          throw new Error('Invalid display');
        await viewer.showDial(view, face, style);
        return settle();
      },
    },
    {
      name: 'inspect_movement',
      description:
        'Read current local movement exploration state and measured renderer counters.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => state(),
    },
    {
      name: 'configure_movement',
      description:
        'Select a mechanism, change reveal, separation, or treatment, or reset the local view. Updates the same visible explorer; no upload or publication.',
      inputSchema: {
        type: 'object',
        properties: {
          group: {
            type: 'string',
            enum: ['whole', ...GROUPS.map((g) => g.id)],
          },
          reset: { type: 'boolean' },
          back: { type: 'boolean' },
          isolated: { type: 'boolean' },
          layout: { type: 'string', enum: ['assembly', 'spread'] },
          reveal: { type: 'number', minimum: 0, maximum: 1 },
          separation: { type: 'number', minimum: 0, maximum: 1 },
          partSpread: { type: 'number', minimum: 0, maximum: 1 },
          side: { type: 'string', enum: ['front', 'back'] },
          treatment: { type: 'string', enum: ['finish', 'function'] },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input) => {
        if (!input || typeof input !== 'object')
          throw new Error('Expected a configuration object');
        const values = input as Record<string, unknown>;
        const allowed = [
          'group',
          'reset',
          'back',
          'isolated',
          'layout',
          'reveal',
          'separation',
          'partSpread',
          'side',
          'treatment',
        ];
        for (const [key, value] of Object.entries(values)) {
          if (!allowed.includes(key)) throw new Error('Unknown setting');
          if (
            ['reveal', 'separation', 'partSpread'].includes(key) &&
            (typeof value !== 'number' ||
              !Number.isFinite(value) ||
              value < 0 ||
              value > 1)
          )
            throw new Error('Invalid separation/reveal');
          if (
            ['reset', 'back', 'isolated'].includes(key) &&
            typeof value !== 'boolean'
          )
            throw new Error('Expected boolean');
          if (
            key === 'layout' &&
            !['assembly', 'spread'].includes(value as string)
          )
            throw new Error('Invalid layout');
          if (
            key === 'side' &&
            (typeof value !== 'string' || !['front', 'back'].includes(value))
          )
            throw new Error('Invalid side');
          if (
            key === 'treatment' &&
            (typeof value !== 'string' ||
              !['finish', 'function'].includes(value))
          )
            throw new Error('Invalid treatment');
          if (
            key === 'group' &&
            (typeof value !== 'string' ||
              !['whole', ...GROUPS.map((g) => g.id)].includes(value))
          )
            throw new Error('Unknown mechanism');
        }
        if (!viewer.ready) throw new Error('Movement is not ready');
        if (values.reset) viewer.reset();
        if (values.back) viewer.back();
        if (values.layout === 'spread') viewer.allParts();
        if (values.layout === 'assembly') viewer.group(null);
        if (values.group !== undefined)
          viewer.group(
            values.group === 'whole' ? null : (values.group as string),
          );
        if (values.side) viewer.setSide(values.side as 'front' | 'back');
        const {
          reset: _reset,
          back: _back,
          layout: _layout,
          group: _group,
          side: _side,
          ...patch
        } = values;
        viewer.patch(patch);
        return settle();
      },
    },
    {
      name: 'select_source_part',
      description:
        'Inspect an exact stable source part or subassembly ID; load its local optional catalog geometry when needed.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input) => {
        const id = (input as { id?: unknown })?.id;
        if (typeof id !== 'string' || !viewer.parts.some((p) => p.id === id))
          throw new Error('Unknown source instance');
        await viewer.select(id);
        return settle();
      },
    },
  ];
  for (const tool of tools) {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifetime.signal }),
      ).catch((e) => console.warn('WebMCP registration unavailable', e));
    } catch (e) {
      console.warn('WebMCP registration unavailable', e);
    }
  }
  return () => lifetime.abort();
}
