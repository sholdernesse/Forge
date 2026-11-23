import { describe, expect, it } from 'vitest';
import { auditActorRef, auditRecorderFromEnvironment, createAuditRecorder } from './audit.js';

describe('dashboard audit events', () => {
  it('creates a stable keyed actor reference without exposing the account subject', () => {
    expect(auditActorRef('user-a', 'a'.repeat(32))).toBe(auditActorRef('user-a', 'a'.repeat(32)));
    expect(auditActorRef('user-a', 'a'.repeat(32))).not.toBe(auditActorRef('user-a', 'b'.repeat(32)));
    expect(auditActorRef('user-a', 'a'.repeat(32))).not.toContain('user-a');
  });

  it('records only bounded mutation metadata', () => {
    const lines: string[] = [];
    createAuditRecorder('a'.repeat(32), (line) => lines.push(line)).dashboardWrite({ requestId: 'request-1', actorId: 'user-a', outcome: 'accepted', reason: 'saved' });
    const event = JSON.parse(lines[0]!) as Record<string, unknown>;
    expect(event).toMatchObject({ event: 'audit.dashboard.write', requestId: 'request-1', outcome: 'accepted', reason: 'saved' });
    expect(lines[0]).not.toContain('user-a');
    expect(event).not.toHaveProperty('state');
  });

  it('records deletion without the account subject', () => {
    const lines: string[] = [];
    createAuditRecorder('a'.repeat(32), (line) => lines.push(line)).dashboardDelete({ requestId: 'request-2', actorId: 'user-a', outcome: 'deleted' });
    expect(JSON.parse(lines[0]!)).toMatchObject({ event: 'audit.dashboard.delete', requestId: 'request-2', outcome: 'deleted' });
    expect(lines[0]).not.toContain('user-a');
  });

  it('requires an operator-managed production key', () => {
    expect(() => auditRecorderFromEnvironment({ NODE_ENV: 'production' })).toThrow('FORGE_AUDIT_HMAC_KEY');
    expect(() => auditRecorderFromEnvironment({ NODE_ENV: 'production', FORGE_AUDIT_HMAC_KEY: 'short' })).toThrow('FORGE_AUDIT_HMAC_KEY');
    expect(() => auditRecorderFromEnvironment({ NODE_ENV: 'production', FORGE_AUDIT_HMAC_KEY: 'a'.repeat(32) })).not.toThrow();
  });
});
