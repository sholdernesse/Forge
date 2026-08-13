targetScope = 'resourceGroup'

param location string = resourceGroup().location
param containerEnvironmentName string
param registryName string
param workloadIdentityName string
param keyVaultName string
param apiAppName string
param webAppName string
param apiImage string
param webImage string
param webOrigin string
param oidcIssuer string
param oidcAudience string
param oidcJwksUrl string
param oidcRequiredScope string = 'access_as_user'
param minimumReplicas int = 0
param maximumReplicas int = 3
param tags object = {}

var commonTags = union(tags, {
  application: 'forge'
  managedBy: 'bicep'
})

resource containerEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerEnvironmentName
}

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: registryName
}

resource workloadIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: workloadIdentityName
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: apiAppName
  location: location
  tags: commonTags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${workloadIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8787
        transport: 'auto'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: registry.properties.loginServer
          identity: workloadIdentity.id
        }
      ]
      secrets: [
        {
          name: 'database-url'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/forge-database-url'
          identity: workloadIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: apiImage
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '8787'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'DATABASE_POOL_SIZE'
              value: '10'
            }
            {
              name: 'FORGE_WEB_ORIGIN'
              value: webOrigin
            }
            {
              name: 'OIDC_ISSUER'
              value: oidcIssuer
            }
            {
              name: 'OIDC_AUDIENCE'
              value: oidcAudience
            }
            {
              name: 'OIDC_JWKS_URL'
              value: oidcJwksUrl
            }
            {
              name: 'OIDC_REQUIRED_SCOPE'
              value: oidcRequiredScope
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8787
              }
              initialDelaySeconds: 15
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 8787
              }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: minimumReplicas
        maxReplicas: maximumReplicas
      }
    }
  }
}

resource web 'Microsoft.App/containerApps@2024-03-01' = {
  name: webAppName
  location: location
  tags: commonTags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${workloadIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        allowInsecure: false
        external: true
        targetPort: 8080
        transport: 'auto'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: registry.properties.loginServer
          identity: workloadIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: webImage
          env: [
            {
              name: 'FORGE_API_UPSTREAM'
              value: 'http://${api.name}'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 8080
              }
              initialDelaySeconds: 5
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 8080
              }
              initialDelaySeconds: 2
              periodSeconds: 10
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: minimumReplicas
        maxReplicas: maximumReplicas
      }
    }
  }
  dependsOn: [
    api
  ]
}

output apiName string = api.name
output webName string = web.name
output webUrl string = 'https://${web.properties.configuration.ingress.fqdn}'
