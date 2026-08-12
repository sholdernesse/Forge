import { useCallback, useEffect, useMemo, useState } from 'react';
import { ForgeAuthClient, forgeAuthConfig, type ForgeAuthSnapshot } from './forgeAuth.js';

const developmentSnapshot: ForgeAuthSnapshot = { status: 'development', name: 'Shane', username: 'Local development' };

export function useForgeAuth(environment: Record<string, unknown>) {
  const config = useMemo(() => forgeAuthConfig(environment, window.location.origin), [environment]);
  const client = useMemo(() => config ? new ForgeAuthClient(config) : null, [config]);
  const [snapshot, setSnapshot] = useState<ForgeAuthSnapshot>(client ? { status: 'loading' } : developmentSnapshot);

  useEffect(() => {
    let active = true;
    if (!client) {
      setSnapshot(developmentSnapshot);
      return;
    }
    void client.initialize()
      .then((next) => { if (active) setSnapshot(next); })
      .catch(() => { if (active) setSnapshot({ status: 'signed-out' }); });
    return () => { active = false; };
  }, [client]);

  const accessToken = useCallback(async () => {
    if (!client) {
      const token = environment.VITE_FORGE_SYNC_TOKEN;
      if (typeof token !== 'string' || !token) throw new Error('Local sync token is not configured');
      return token;
    }
    return client.accessToken();
  }, [client, environment]);

  return {
    ...snapshot,
    accessToken,
    signIn: useCallback(() => client?.signIn() ?? Promise.resolve(), [client]),
    signOut: useCallback(() => client?.signOut() ?? Promise.resolve(), [client]),
  };
}
