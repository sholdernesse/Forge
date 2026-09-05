# Sprint 4.58 — Trusted Local HTTPS

## Outcome

Forge can run through a separate local HTTPS development mode so physical phones can test secure-browser features such as camera barcode scanning without changing the normal HTTP workflow.

## Delivered

- Adds `dev:https` for the Forge web app.
- Loads a developer-owned certificate and key only in HTTPS mode.
- Keeps local certificate material outside version control.
- Documents Windows certificate generation with mkcert.
- Documents iPhone CA installation and full-trust activation.
- Covers local-IP changes, Windows Firewall, Safari permission, and network requirements.
- Links the camera-testing setup from the repository README.

## Boundaries

- Forge does not generate, store, or distribute developer certificate keys.
- The iPhone must explicitly trust the developer CA before Safari treats the page as secure.
- The certificate must contain the current local IPv4 address used by the phone.
- Production continues to rely on its platform-managed HTTPS certificate.

## Acceptance

- The normal HTTP development and production build paths remain unchanged.
- HTTPS mode starts successfully when the documented certificate files exist.
- Certificate files are ignored by Git.
- Documentation never instructs the developer to transfer the CA private key.
