#!/usr/bin/env bash
set -euo pipefail

required=(
  CANDIDATE_COMMIT
  DEPLOYMENT_URL
  PHYSICAL_RESULT
  PHYSICAL_EVIDENCE_URL
  POSTGRES_RESULT
  POSTGRES_EVIDENCE_URL
  RENDER_RESULT
  RENDER_EVIDENCE_URL
  IDENTITY_RESULT
  IDENTITY_EVIDENCE_URL
  FAILOVER_RESULT
  FAILOVER_EVIDENCE_URL
)

for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Release readiness evidence is missing $name" >&2
    exit 2
  fi
done

if [[ ! "$CANDIDATE_COMMIT" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo "CANDIDATE_COMMIT must be a full 40-character Git commit SHA" >&2
  exit 2
fi

if [[ ! "$DEPLOYMENT_URL" =~ ^https://[^[:space:]]+$ ]]; then
  echo "DEPLOYMENT_URL must be an HTTPS URL" >&2
  exit 2
fi

gates=(
  "Physical desktop/mobile|PHYSICAL_RESULT|PHYSICAL_EVIDENCE_URL"
  "PostgreSQL recovery|POSTGRES_RESULT|POSTGRES_EVIDENCE_URL"
  "Render activation|RENDER_RESULT|RENDER_EVIDENCE_URL"
  "Identity and account isolation|IDENTITY_RESULT|IDENTITY_EVIDENCE_URL"
  "DNS cutover and failback|FAILOVER_RESULT|FAILOVER_EVIDENCE_URL"
)

failed=0
{
  echo "## Forge release readiness"
  echo
  echo "- Candidate: \`$CANDIDATE_COMMIT\`"
  echo "- Deployment: $DEPLOYMENT_URL"
  echo
  echo "| Gate | Result | Evidence |"
  echo "| --- | --- | --- |"
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"

for gate in "${gates[@]}"; do
  IFS='|' read -r label result_name evidence_name <<< "$gate"
  result="${!result_name}"
  evidence="${!evidence_name}"

  case "$result" in
    PASS|FAIL|BLOCKED) ;;
    *)
      echo "$label has invalid result '$result'; expected PASS, FAIL, or BLOCKED" >&2
      exit 2
      ;;
  esac

  if [[ ! "$evidence" =~ ^https://[^[:space:]]+$ ]]; then
    echo "$label evidence must be an HTTPS URL" >&2
    exit 2
  fi

  echo "| $label | $result | [evidence]($evidence) |" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
  if [[ "$result" != "PASS" ]]; then
    echo "Release blocked: $label is $result" >&2
    failed=1
  fi
done

if (( failed )); then
  exit 1
fi

echo "All mandatory Forge release gates passed with evidence."
