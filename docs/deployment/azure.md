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
```

The PostgreSQL administrator password should be a generated high-entropy value used only for the deployment. It is passed as a secure Bicep parameter and stored in the Forge Key Vault as part of the complete database URL.

## GitHub environment variables

```text
AZURE_RESOURCE_GROUP
VITE_ENTRA_CLIENT_ID
VITE_ENTRA_AUTHORITY
VITE_ENTRA_API_SCOPE
OIDC_ISSUER
OIDC_AUDIENCE
OIDC_JWKS_URL
```

The Entra SPA values are public application configuration. The OIDC values tell the API which issuer, audience, signing keys, and delegated scope to accept.

## Deploy

Open **Actions → Deploy Forge to Azure → Run workflow**. Select the environment and region, enable the billable-resource confirmation, and run the workflow.

Start with `dev`. Do not deploy `prod` until redirect login, cross-device synchronization, backup restoration, and account isolation have passed staging acceptance.

## Cost controls

The initial definition uses Consumption Container Apps with zero minimum replicas, Basic ACR, a burstable PostgreSQL server, 32 GB database storage, seven-day backups, and 30-day log retention. Azure PostgreSQL and Log Analytics can still incur charges while applications are scaled to zero. Review Azure pricing and budgets before the first run.
