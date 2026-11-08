# Azure deployment

Forge deploys to Azure Container Apps using a two-stage Bicep release:

1. `infra/main.bicep` provisions the shared foundation.
2. GitHub builds immutable API and web images tagged with the commit SHA and pushes them to Azure Container Registry.
3. `infra/apps.bicep` deploys the private API and public web gateway.
4. The workflow verifies the public `/health` route through the gateway.

The workflow is manual and requires the operator to select **Create/update billable Azure resources**. Committing this deployment code does not create Azure resources.

## Security model

- GitHub authenticates to Azure with OIDC federation; no Azure client secret is stored.
- The web gateway is the only public Container App.
- The API uses internal ingress and same-environment service discovery.
- PostgreSQL Flexible Server has no public endpoint and is placed in a delegated subnet.
- PostgreSQL DNS resolves through a private DNS zone linked to the virtual network.
- A user-assigned managed identity pulls images from ACR and reads the database URL from Key Vault.
- ACR admin credentials are disabled.
- Production Key Vault purge protection is enabled.
- Container images are referenced by immutable Git commit tags.

## One-time Azure setup

Create a resource group and an Entra application or user-assigned identity for GitHub Actions. Give that deployment identity only the permissions needed within the Forge resource group, then create a federated credential for the GitHub environment subject:

```text
repo:sholdernesse/Forge:environment:forge-dev
repo:sholdernesse/Forge:environment:forge-staging
repo:sholdernesse/Forge:environment:forge-prod
```

Microsoft documents GitHub OIDC federation in [Use the Azure Login action with OpenID Connect](https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect).

Create matching GitHub environments named `forge-dev`, `forge-staging`, and `forge-prod`. Configure approval protection for staging and production.

## GitHub environment secrets

Configure these as environment secrets:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
FORGE_POSTGRES_ADMIN_PASSWORD
FORGE_AUDIT_HMAC_KEY
OPENAI_API_KEY
USDA_FOODDATA_API_KEY
```

The PostgreSQL administrator password should be a generated high-entropy value used only for the deployment. `FORGE_AUDIT_HMAC_KEY` must be an independent generated secret of at least 32 characters. The OpenAI and USDA credentials must be restricted server-side keys with spending/rate controls appropriate to the environment. These values are passed as secure Bicep parameters and stored in the Forge Key Vault; none is compiled into the web image.

## GitHub environment variables

```text
AZURE_RESOURCE_GROUP
VITE_ENTRA_CLIENT_ID
VITE_ENTRA_AUTHORITY
VITE_ENTRA_API_SCOPE
VITE_FORGE_SUPPORT_EMAIL
OIDC_ISSUER
OIDC_AUDIENCE
OIDC_JWKS_URL
OIDC_REQUIRED_SCOPE
FORGE_BETA_COUNTRIES
OPENAI_VISION_MODEL
```

The Entra SPA values and support address are public application configuration. `VITE_FORGE_SUPPORT_EMAIL` must be a verified, monitored mailbox and is compiled into the public Privacy, Terms, and Support pages. The OIDC values tell the API which issuer, audience, signing keys, and delegated scope to accept. `OPENAI_VISION_MODEL` selects the approved image-capable server model without exposing the API key.

## Read-only preflight

Run `corepack pnpm beta:preflight` (or append `--json`) with the intended
configuration supplied through your current environment. The command does not
load `.env.local` automatically and does not read GitHub environment secrets.
A missing local setting does not prove the GitHub environment lacks it. Do not
pass secret values as command arguments or paste them into support reports.

The report lists configuration names and corrective actions without their values.
Exit 0 means configuration prerequisites pass; exit 2 means blocked or invalid
input. It checks required Azure/Entra/provider settings, HTTPS identity endpoints,
audit-key length, support-contact format, US-only admission, delegated-scope
alignment, and the actual canonical consent approval flag. It makes no network
requests, provisions nothing, applies no migrations, and grants no invitations.
It does not prove credentials work, that a mailbox is monitored, or that a
candidate passed operational acceptance.

The Azure workflow runs this same check against the selected GitHub environment
**before Azure sign-in or any resource provisioning**. Draft/unreadable policy
or invalid configuration stops the run before billable changes. The existing
post-deployment smoke check remains required.

`OIDC_REQUIRED_SCOPE` defaults to `access_as_user` and is passed to the API
through Bicep. It must match the delegated scope suffix in
`VITE_ENTRA_API_SCOPE`; configure both when using a custom permission name.
`FORGE_BETA_COUNTRIES` defaults to `US` in the deployment workflow.

## Deploy

Open **Actions → Deploy Forge to Azure → Run workflow**. Select the environment and region, enable the billable-resource confirmation, and run the workflow.

Start with `dev`. Do not deploy `prod` until redirect login, cross-device synchronization, backup restoration, and account isolation have passed staging acceptance.

## Cost controls

The initial definition uses Consumption Container Apps with zero minimum replicas, Basic ACR, a burstable PostgreSQL server, 32 GB database storage, seven-day backups, and 30-day log retention. Azure PostgreSQL and Log Analytics can still incur charges while applications are scaled to zero. Review Azure pricing and budgets before the first run.
