/**
 * Resolve once in Vite config; the same literal is compiled into SSR and client.
 * @param {'build' | 'serve'} command
 * @param {Record<string, string | undefined>} env
 */
export function workshopEntryEnabled(command, env) {
  const override = env.WORKSHOP_ENTRY_ENABLED;
  if (override !== undefined && override !== '') {
    if (override === 'true') return true;
    if (override === 'false') return false;
    throw new Error('WORKSHOP_ENTRY_ENABLED must be "true" or "false".');
  }
  if (env.VERCEL_ENV) {
    return env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development';
  }
  // A local production build is hidden, even when NODE_ENV/mode is customized.
  return command === 'serve';
}
