export interface DashboardEnvelope {
  state: unknown;
  updatedAt: string;
  revision: string;
}

export interface DashboardRepository {
  get(userId: string): Promise<DashboardEnvelope | null>;
  put(userId: string, state: unknown, expectedRevision?: string): Promise<DashboardEnvelope>;
  close?(): Promise<void>;
}

export class RevisionConflictError extends Error {
  constructor() {
    super('Dashboard revision conflict');
    this.name = 'RevisionConflictError';
  }
}

export interface AuthenticatedUser {
  id: string;
}

export interface AuthVerifier {
  verify(authorization: string | null): Promise<AuthenticatedUser | null>;
}
