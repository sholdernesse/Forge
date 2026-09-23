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

for variable in OPENAI_API_KEY OPENAI_VISION_MODEL USDA_FOODDATA_API_KEY; do
  grep -q "key: ${variable}" render.yaml || fail "standby API is missing ${variable}"
done

grep -q "name: 'forge-openai-api-key'" infra/main.bicep || fail "Azure Key Vault is missing the OpenAI secret"
grep -q "name: 'forge-usda-fooddata-api-key'" infra/main.bicep || fail "Azure Key Vault is missing the USDA secret"
grep -q "name: 'OPENAI_API_KEY'" infra/apps.bicep || fail "Azure API app is missing the OpenAI secret reference"

for variable in VITE_ENTRA_CLIENT_ID VITE_ENTRA_AUTHORITY VITE_ENTRA_API_SCOPE VITE_FORGE_SUPPORT_EMAIL VITE_FORGE_RELEASE_SHA; do
  grep -q "key: ${variable}" render.yaml || fail "standby web build is missing ${variable}"
done

for location in 'location /assets/' 'location / {'; do
  block="$(sed -n "/${location//\//\\/}/,/^  }/p" apps/web/nginx.conf)"
  grep -q 'X-Content-Type-Options' <<< "$block" || fail "$location is missing route-level security headers"
  grep -q 'X-Frame-Options' <<< "$block" || fail "$location is missing frame protection"
done

if grep -Eq 'key: ENTRA_(ISSUER|AUDIENCE|JWKS_URI)' render.yaml; then
  fail "standby API uses unsupported authentication variable names"
fi

if grep -Eq 'FORGE_DEV_TOKEN|forge-local-development-token' render.yaml infra/*.bicep; then
  fail "development credentials must not be present in deployment manifests"
fi

grep -q 'external: false' infra/apps.bicep || fail "Azure must include internal-only ingress"
echo "Deployment security validation passed"
