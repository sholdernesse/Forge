# Microsoft Entra External ID for Forge

Forge uses the OAuth 2.0 authorization-code flow with PKCE through MSAL. The browser receives a short-lived delegated access token; the API verifies its signature, issuer, audience, and `access_as_user` scope before deriving the database owner from `sub`.

## 1. Create the external tenant

Create a dedicated [Microsoft Entra External ID external tenant](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-create-external-tenant-portal). Keep Forge customer identities separate from the workforce directory.

## 2. Register the API

In the external tenant:

1. Register an application named `Forge API` without a redirect URI.
2. Under **Expose an API**, accept `api://<api-client-id>` as the Application ID URI.
3. Add a delegated scope named `access_as_user` that admins and users can consent to.
4. Record the API Application (client) ID and tenant identifiers.

Microsoft documents this flow in [Configure an application to expose a web API](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-expose-web-apis).

## 3. Register the SPA

1. Register another application named `Forge Web`.
2. Add the **Single-page application** redirect URI `http://localhost:4173`.
3. Add the production HTTPS URL later.
4. Under **API permissions**, add the Forge API delegated permission `access_as_user`.
5. Grant tenant-wide admin consent; customer users in external tenants cannot grant permissions themselves.
6. Associate `Forge Web` with a sign-up and sign-in user flow.

The production SPA uses authorization code plus PKCE and does not use a client secret.

## 4. Configure the web application

```env
VITE_FORGE_SYNC_URL=https://api.forge.example.com
VITE_ENTRA_CLIENT_ID=<forge-web-client-id>
VITE_ENTRA_AUTHORITY=https://<tenant-subdomain>.ciamlogin.com/<tenant-subdomain>.onmicrosoft.com
VITE_ENTRA_API_SCOPE=api://<forge-api-client-id>/access_as_user
VITE_ENTRA_REDIRECT_URI=https://app.forge.example.com
```

When the Entra variables are present, Forge shows Sign in/Sign out controls and obtains API tokens silently after login. `VITE_FORGE_SYNC_TOKEN` is ignored by the authentication path and should not be defined in production.

## 5. Configure the API

Use the values from the API token's OpenID configuration and claims:

```env
NODE_ENV=production
OIDC_ISSUER=https://<tenant-subdomain>.ciamlogin.com/<tenant-id>/v2.0
OIDC_AUDIENCE=<forge-api-client-id>
OIDC_JWKS_URL=https://<tenant-subdomain>.ciamlogin.com/<tenant-subdomain>.onmicrosoft.com/discovery/v2.0/keys
OIDC_REQUIRED_SCOPE=access_as_user
```

Confirm `issuer` and `jwks_uri` against the tenant's OpenID configuration document before deployment. External ID documents the discovery URL format in [Test a user flow](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-test-user-flows).

## Security invariants

- Never place an app secret in a `VITE_` variable.
- The SPA registration is a public client and uses PKCE.
- The API accepts access tokens, not ID tokens.
- The API authorizes the exact delegated scope.
- The database owner always comes from verified `sub`.
- Development bearer tokens are disabled when `NODE_ENV=production`.
