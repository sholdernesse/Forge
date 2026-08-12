# Package map

```text
apps/web
  -> @forge/coach
  -> @forge/digital-twin

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
