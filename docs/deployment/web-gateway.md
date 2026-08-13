# Forge production web gateway

The production web image serves the Vite application and acts as the only public application ingress. Requests under `/v1` and `/health` are proxied to the provider-neutral `FORGE_API_UPSTREAM` runtime value; no cloud-specific API hostname is compiled into the image.

This same-origin boundary has three useful properties:

- the API does not need public ingress
- browser sync does not require production CORS exceptions
- web and mobile-browser traffic use one TLS hostname

The browser still obtains a delegated Entra External ID access token and sends it to `/v1/dashboard`. Nginx forwards that authorization header unchanged; the API remains responsible for issuer, audience, signature, subject, and scope validation.

## Build

Run from the repository root:

```bash
docker build \
  --file apps/web/Dockerfile \
  --build-arg VITE_FORGE_SYNC_URL=/ \
  --build-arg VITE_ENTRA_CLIENT_ID=<forge-web-client-id> \
  --build-arg VITE_ENTRA_AUTHORITY=https://<tenant>.ciamlogin.com/<tenant>.onmicrosoft.com \
  --build-arg VITE_ENTRA_API_SCOPE=api://<forge-api-client-id>/access_as_user \
  --build-arg VITE_ENTRA_REDIRECT_URI=https://<forge-hostname> \
  --tag forge-web:local .
```

The Entra values are public SPA configuration, not credentials. Do not pass client secrets or development bearer tokens as image build arguments.

## Run

The runtime gateway resolves `FORGE_API_UPSTREAM`. In Azure Container Apps it should point to the API through same-environment service discovery:

```text
FORGE_API_UPSTREAM=http://forge-api
```

Only the web container should have external ingress. The API container should use internal ingress on port `8787`.

On another provider, set the same variable to that provider's private service address (for example `http://forge-api-standby:8787` on the dormant Render Blueprint). Never point it at a public API hostname merely to work around private DNS.

## Security boundary

The gateway adds conservative browser headers, rejects requests larger than one megabyte at the proxy boundary, disables Nginx version disclosure, and gives hashed assets immutable caching. The SPA shell is never cached so authentication and deployment changes become visible immediately.
