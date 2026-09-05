import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type Configuration,
} from '@azure/msal-browser';

export type ForgeAuthStatus = 'development' | 'loading' | 'signed-out' | 'signed-in';

export interface ForgeAuthConfig {
  clientId: string;
  authority: string;
  apiScope: string;
  redirectUri: string;
}

export interface ForgeAuthSnapshot {
  status: ForgeAuthStatus;
  name?: string;
  username?: string;
}

export function forgeAuthConfig(environment: Record<string, unknown>, locationOrigin: string): ForgeAuthConfig | null {
  const clientId = environment.VITE_ENTRA_CLIENT_ID;
  const authority = environment.VITE_ENTRA_AUTHORITY;
  const apiScope = environment.VITE_ENTRA_API_SCOPE;
  if (typeof clientId !== 'string' || !clientId.trim()
    || typeof authority !== 'string' || !authority.trim()
    || typeof apiScope !== 'string' || !apiScope.trim()) return null;
  const redirectUri = typeof environment.VITE_ENTRA_REDIRECT_URI === 'string' && environment.VITE_ENTRA_REDIRECT_URI.trim()
    ? environment.VITE_ENTRA_REDIRECT_URI
    : locationOrigin;
  return { clientId, authority, apiScope, redirectUri };
}

export class ForgeAuthClient {
  private readonly application: PublicClientApplication;
  private account: AccountInfo | null = null;
  private initialized = false;

  constructor(private readonly config: ForgeAuthConfig) {
    const msalConfig: Configuration = {
      auth: {
        clientId: config.clientId,
        authority: config.authority,
        redirectUri: config.redirectUri,
        postLogoutRedirectUri: config.redirectUri,
      },
      cache: { cacheLocation: 'localStorage' },
    };
    this.application = new PublicClientApplication(msalConfig);
  }

  async initialize(): Promise<ForgeAuthSnapshot> {
    if (!this.initialized) {
      await this.application.initialize();
      const redirect = await this.application.handleRedirectPromise();
      this.account = redirect?.account ?? this.application.getActiveAccount() ?? this.application.getAllAccounts()[0] ?? null;
      if (this.account) this.application.setActiveAccount(this.account);
      this.initialized = true;
    }
    return this.snapshot();
  }

  snapshot(): ForgeAuthSnapshot {
    return this.account
      ? { status: 'signed-in', ...(this.account.name ? { name: this.account.name } : {}), ...(this.account.username ? { username: this.account.username } : {}) }
      : { status: 'signed-out' };
  }

  async signIn(): Promise<void> {
    await this.application.loginRedirect({ scopes: [this.config.apiScope] });
  }

  async signOut(): Promise<void> {
    await this.initialize();
    await this.application.logoutRedirect({ account: this.account });
  }

  async accessToken(): Promise<string> {
    await this.initialize();
    if (!this.account) throw new InteractionRequiredAuthError('sign_in_required');
    try {
      const result = await this.application.acquireTokenSilent({ account: this.account, scopes: [this.config.apiScope] });
      return result.accessToken;
    } catch (error) {
      if (!(error instanceof InteractionRequiredAuthError)) throw error;
      await this.application.acquireTokenRedirect({ account: this.account, scopes: [this.config.apiScope] });
      throw error;
    }
  }
}
