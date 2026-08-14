#!/usr/bin/env bash
set -euo pipefail

fail() { echo "deployment security validation: $*" >&2; exit 1; }

[[ -f render.yaml ]] || fail "render.yaml is missing"
[[ -f infra/apps.bicep ]] || fail "Azure application template is missing"

# The standby must be deliberately activated, keep its database private, and
# route browser traffic through the public web gateway rather than public API.
grep -q 'autoDeployTrigger: off' render.yaml || fail "Render auto-deploy must remain disabled"
grep -q 'type: pserv' render.yaml || fail "Render API must be a private service"
grep -q 'ipAllowList: \[\]' render.yaml || fail "Render PostgreSQL must deny public connections"
grep -q 'property: hostport' render.yaml || fail "standby web gateway must discover the private API address"

for variable in OIDC_ISSUER OIDC_AUDIENCE OIDC_JWKS_URL OIDC_REQUIRED_SCOPE; do
  grep -q "key: ${variable}" render.yaml || fail "standby API is missing ${variable}"
done

for variable in VITE_ENTRA_CLIENT_ID VITE_ENTRA_AUTHORITY VITE_ENTRA_API_SCOPE; do
  grep -q "key: ${variable}" render.yaml || fail "standby web build is missing ${variable}"
done

if grep -Eq 'key: ENTRA_(ISSUER|AUDIENCE|JWKS_URI)' render.yaml; then
  fail "standby API uses unsupported authentication variable names"
fi

if grep -Eq 'FORGE_DEV_TOKEN|forge-local-development-token' render.yaml infra/*.bicep; then
  fail "development credentials must not be present in deployment manifests"
fi

grep -q 'external: false' infra/apps.bicep || fail "Azure must include internal-only ingress"
echo "Deployment security validation passed"
