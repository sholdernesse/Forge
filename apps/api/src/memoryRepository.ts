import { randomUUID } from 'node:crypto';
import { RevisionConflictError, type DashboardEnvelope, type DashboardRepository } from './types.js';

export class MemoryDashboardRepository implements DashboardRepository {
  private readonly dashboards = new Map<string, DashboardEnvelope>();

  async get(userId: string): Promise<DashboardEnvelope | null> {
    return this.dashboards.get(userId) ?? null;
  }

  async put(userId: string, state: unknown, expectedRevision?: string): Promise<DashboardEnvelope> {
    const existing = this.dashboards.get(userId);
    if (existing?.revision !== expectedRevision || (!existing && expectedRevision)) throw new RevisionConflictError();
    const envelope = { state, updatedAt: new Date().toISOString(), revision: randomUUID() };
    this.dashboards.set(userId, envelope);
    return envelope;
  }
}
