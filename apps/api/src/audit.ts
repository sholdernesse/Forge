import { createHmac } from 'node:crypto';

export type DashboardAuditOutcome = 'accepted' | 'conflict' | 'rejected' | 'deleted' | 'absent';
export type DashboardAuditReason = 'saved' | 'revision_conflict' | 'payload_too_large' | 'invalid_dashboard' | 'invalid_json' | 'deleted' | 'absent';

export interface DashboardAuditEvent {
  timestamp: string;
  level: 'info';
  event: 'audit.dashboard.write' | 'audit.dashboard.delete';
  requestId: string;
  actorRef: string;
  outcome: DashboardAuditOutcome;
  reason: DashboardAuditReason;
}

export interface AuditRecorder {
  dashboardWrite(input: { requestId: string; actorId: string; outcome: DashboardAuditOutcome; reason: DashboardAuditReason }): void;
  dashboardDelete(input: { requestId: string; actorId: string; outcome: 'deleted' | 'absent' }): void;
}

export function auditActorRef(actorId: string, key: string): string {
  return createHmac('sha256', key).update(actorId).digest('hex').slice(0, 24);
}

export function createAuditRecorder(key: string, sink: (line: string) => void = (line) => console.log(line)): AuditRecorder {
  const write = (event: DashboardAuditEvent) => sink(JSON.stringify(event));
  return {
    dashboardWrite(input) {
      write({
        timestamp: new Date().toISOString(),
        level: 'info',
        event: 'audit.dashboard.write',
        requestId: input.requestId,
        actorRef: auditActorRef(input.actorId, key),
        outcome: input.outcome,
        reason: input.reason,
      });
    },
    dashboardDelete(input) {
      write({
        timestamp: new Date().toISOString(),
        level: 'info',
        event: 'audit.dashboard.delete',
        requestId: input.requestId,
        actorRef: auditActorRef(input.actorId, key),
        outcome: input.outcome,
        reason: input.outcome,
      });
    },
  };
}

export function auditRecorderFromEnvironment(environment: NodeJS.ProcessEnv): AuditRecorder {
  const configured = environment.FORGE_AUDIT_HMAC_KEY;
  if (environment.NODE_ENV === 'production' && (!configured || configured.length < 32)) {
    throw new Error('FORGE_AUDIT_HMAC_KEY must contain at least 32 characters in production');
  }
  return createAuditRecorder(configured ?? 'forge-local-audit-key-not-for-production');
}
