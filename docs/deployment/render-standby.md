# Render standby activation and failover

`render.yaml` is a **dormant** recovery Blueprint, not a second production environment. It describes a public web gateway, a private API, and a PostgreSQL database, but `autoDeployTrigger: off` prevents repository pushes from releasing it. Do not create the Blueprint until an authorized failover exercise or an Azure incident; creating it can incur Render charges.

## Prepare without activating

1. Keep the Blueprint reviewed on the production branch.
2. Retain encrypted, access-controlled backups made with `scripts/postgres/backup.sh` outside either cloud account.
3. Record the Entra issuer, audience, JWKS URI, SPA build values, and DNS ownership in the recovery vault. Do not commit their values.
4. Test restoration at least quarterly in an isolated database, then destroy the exercise resources.

## Activate

1. Declare an incident and assign one operator to Azure containment and another to Render activation.
2. In Render, create a Blueprint from this repository and review every resource before applying it.
3. Supply the secret Entra API variables and build the web image with the same public Entra SPA configuration used by the primary release.
4. Set `FORGE_WEB_ORIGIN` to the final HTTPS standby origin. Confirm the API remains a private service and PostgreSQL has an empty IP allow list.
5. Download the latest trusted backup and checksum to a secured operator host. Restore it with:

   ```bash
   DATABASE_URL='<render-internal-database-url>' \
   CONFIRM_RESTORE=forge \
   scripts/postgres/restore.sh backups/forge-<timestamp>.dump
   ```

6. Test `/health`, authentication, account isolation, reads, and a disposable write through the web hostname.
7. Lower DNS TTL if necessary, switch the application record, and monitor errors and synchronization conflicts.

## Fail back

Freeze writes or announce a maintenance window, back up the active Render database, restore it into a clean Azure database, validate Azure through a non-public test hostname, and only then return DNS. Preserve incident backups and logs. After the retention window, delete the Render Blueprint so the standby becomes dormant again.

Never run both sites as writable primaries. Forge does not provide multi-primary replication or automatic conflict resolution between databases.

