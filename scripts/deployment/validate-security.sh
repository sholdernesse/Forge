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
grep -q 'FORGE_API_UPSTREAM' render.yaml || fail "standby web gateway must use private API routing"

if grep -Eq 'FORGE_DEV_TOKEN|forge-local-development-token' render.yaml infra/*.bicep; then
  fail "development credentials must not be present in deployment manifests"
fi

grep -q 'external: false' infra/apps.bicep || fail "Azure must include internal-only ingress"
echo "Deployment security validation passed"

