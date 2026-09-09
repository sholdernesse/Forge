# Local HTTPS for phone camera testing

Forge keeps its normal HTTP development command and provides a separate HTTPS mode for testing browser features such as camera barcode scanning on a phone.

## 1. Install and initialize mkcert

Run PowerShell as your normal Windows user:

```powershell
winget install FiloSottile.mkcert
mkcert -install
```

Restart PowerShell if `mkcert` is not recognized immediately.

## 2. Create a certificate for the Forge computer

From the Forge repository root, replace `192.168.1.122` if the computer's current IPv4 address is different:

```powershell
New-Item -ItemType Directory -Force apps/web/.cert
mkcert -key-file apps/web/.cert/forge-key.pem -cert-file apps/web/.cert/forge-cert.pem localhost 127.0.0.1 ::1 192.168.1.122
```

The `.cert` directory is ignored by Git. Never commit or share the private key or mkcert root CA private key.

## 3. Trust the local CA on the iPhone

Find mkcert's CA directory:

```powershell
mkcert -CAROOT
```

Transfer only `rootCA.pem` from that directory to the iPhone and install it as a configuration profile. Then enable full trust under **Settings > General > About > Certificate Trust Settings**.

Do not transfer `rootCA-key.pem`.

## 4. Start Forge over HTTPS

```powershell
corepack pnpm dev:https
```

Docker Desktop must be running. This one command stops any conflicting Compose API container, starts and waits for the local PostgreSQL container, applies the database schema, and then starts both the HTTPS web app and local Forge API. The web server proxies `/api` internally so the phone never makes an insecure HTTP request.

If startup stops before the API and web addresses appear, inspect the database with:

```powershell
docker compose ps postgres
docker compose logs --tail=100 postgres
```

On the iPhone, open:

```text
https://192.168.1.122:4173
```

The computer and phone must be on the same local network. Allow Node.js through Windows Firewall if prompted. If the computer's local IP changes, regenerate the certificate with the new address.

## Camera behavior

Safari will offer camera access only after the page is a trusted secure context. The first scan should produce an iOS camera-permission prompt. If permission was previously denied, enable it for the site in Safari settings.

The local API and Vite web app use the same development-only token automatically. Vite development deliberately ignores old `VITE_FORGE_SYNC_URL` and `VITE_FORGE_SYNC_TOKEN` values and always routes through same-origin `/api`. This prevents a phone from interpreting `localhost` as the phone itself. Production continues to require configured identity, database, and managed HTTPS settings.
