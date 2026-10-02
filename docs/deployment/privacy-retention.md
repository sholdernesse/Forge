# Privacy and retention operations

Forge stores the minimum account-scoped dashboard snapshot needed to synchronize the product. The application does not use operational logs as product analytics.

Meal-photo analysis is opt-in. The browser resizes the image and renders it into a new JPEG, removing the original file metadata before upload. The authenticated API passes the prepared image to the configured vision provider in memory and does not write the image to PostgreSQL, logs, object storage, or the synchronized dashboard. Only food entries the user reviews and explicitly adds become dashboard data.

## User controls

- **Export:** Settings creates a versioned JSON file containing the current Forge dashboard state. Authentication tokens, database metadata, request logs, and audit records are not part of the export.
- **Local reset:** Removes the browser-local dashboard only. It does not claim to delete a signed-in cloud copy.
- **Synchronized-data deletion:** An authenticated `DELETE /v1/dashboard` removes only that verified subject’s primary dashboard row. The browser clears its local dashboard only after the server confirms deletion, leaves a deletion marker that blocks automatic cloud recreation, signs out, and reloads. Completing a new onboarding explicitly clears the marker and starts a fresh dashboard.

The deletion control does not delete the user’s Microsoft Entra identity because Forge does not own that identity record.

## Retention schedule

| Data | Active retention | Deletion behavior |
|---|---|---|
| Dashboard snapshot | While the user uses synchronized Forge | Primary row is deleted immediately after an authenticated request succeeds. |
| Browser dashboard | Until browser reset or confirmed synchronized deletion | Removed from that browser after confirmed deletion. Other offline devices must reconnect before reuse and should be reset during support-assisted deletion. |
| Azure PostgreSQL backups | Infrastructure-configured seven days | Backup recovery points expire on schedule; individual rows are not edited inside immutable recovery points. |
| API and mutation logs | Infrastructure-configured 30 days | Expire through Log Analytics retention; access remains role-limited. |
| User exports | Controlled by the user | Forge does not receive or retain the downloaded file. |
| Submitted meal photo | Request lifetime only in Forge | Not persisted by Forge. The prepared image is released after the vision request; provider handling follows the approved API account configuration and contract. |

## Recovery requirement

A database restore is never returned directly to public service. In the isolated validation environment, operators must identify every `audit.dashboard.delete` event newer than the restored recovery point, recompute actor references with the approved audit key, remove matching restored dashboard rows, and record the reconciliation before traffic is enabled. If deletion reconciliation cannot be proven, the restore remains blocked.

## Support procedure

Support may ask for the request ID and approximate UTC time, never an access token or exported health file. Confirm whether the user means local reset, synchronized dashboard deletion, or identity-account closure. Identity closure must be handled through the identity owner’s approved process. Record operational evidence without copying dashboard contents into tickets.
