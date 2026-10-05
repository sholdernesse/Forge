# Package map

```text
apps/web
  -> @forge/coach
  -> @forge/digital-twin

apps/api
  -> PostgreSQL
  -> OIDC/JWKS identity provider

@forge/coach
  -> @forge/recommendation-engine
  -> @forge/digital-twin

@forge/recommendation-engine
  -> @forge/digital-twin
  -> @forge/shared

@forge/digital-twin
  -> @forge/shared
```

Dependencies point inward toward stable domain contracts.

The web client never supplies a database user identifier. The API derives ownership from the verified access-token subject and applies revision-checked writes to the user's snapshot.
