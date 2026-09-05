import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthVerifier, AuthenticatedUser } from './types.js';

export interface JwtAuthConfig {
  issuer: string;
  audience: string;
  jwksUrl: string;
  requiredScope: string;
}

export function hasRequiredScope(scopeClaim: unknown, requiredScope: string): boolean {
  return typeof scopeClaim === 'string' && scopeClaim.split(/\s+/).includes(requiredScope);
}

function bearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match?.[1]?.trim() || null;
}

export class JwtAuthVerifier implements AuthVerifier {
  private readonly jwks;

  constructor(private readonly config: JwtAuthConfig) {
    this.jwks = createRemoteJWKSet(new URL(config.jwksUrl));
  }

  async verify(authorization: string | null): Promise<AuthenticatedUser | null> {
    const token = bearerToken(authorization);
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
      return typeof payload.sub === 'string' && payload.sub && hasRequiredScope(payload.scp, this.config.requiredScope)
        ? { id: payload.sub }
        : null;
    } catch {
      return null;
    }
  }
}

export class DevelopmentTokenVerifier implements AuthVerifier {
  constructor(private readonly token: string, private readonly userId = 'forge-development-user') {}

  async verify(authorization: string | null): Promise<AuthenticatedUser | null> {
    const supplied = bearerToken(authorization);
    return supplied === this.token ? { id: this.userId } : null;
  }
}

export function authVerifierFromEnvironment(environment: NodeJS.ProcessEnv): AuthVerifier {
  if (environment.NODE_ENV !== 'production') {
    return new DevelopmentTokenVerifier(environment.FORGE_DEV_TOKEN ?? 'forge-local-development', environment.FORGE_DEV_USER_ID);
  }
  const issuer = environment.OIDC_ISSUER;
  const audience = environment.OIDC_AUDIENCE;
  const jwksUrl = environment.OIDC_JWKS_URL;
  const requiredScope = environment.OIDC_REQUIRED_SCOPE;
  if (!issuer || !audience || !jwksUrl || !requiredScope) throw new Error('OIDC_ISSUER, OIDC_AUDIENCE, OIDC_JWKS_URL, and OIDC_REQUIRED_SCOPE are required');
  return new JwtAuthVerifier({ issuer, audience, jwksUrl, requiredScope });
}
