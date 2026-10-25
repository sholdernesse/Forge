import { betaStatus, type BetaAccess } from './betaAccess.js';
import { consentPolicy, policyDigest, hasCurrentConsent, type ConsentRepository, type ConsentPolicy } from './consent.js';
import { RevisionConflictError, type AuthVerifier, type DashboardRepository } from './types.js';
import type { FoodProvider } from './foodProvider.js';
import { mealPhotoFailureReason, type MealPhotoAnalyzer } from './mealPhotoAnalyzer.js';
import type { RequestRateLimiter } from './rateLimit.js';
import type { AuditRecorder, DashboardAuditOutcome, DashboardAuditReason } from './audit.js';

const MAX_DASHBOARD_BYTES = 1_000_000;
const MAX_MEAL_PHOTO_BODY_BYTES = 1_000_000;

export interface ApiDependencies {
  beta?: BetaAccess;
  auth: AuthVerifier;
  dashboards: DashboardRepository;
  allowedOrigin?: string;
  foodProvider?: FoodProvider;
  mealPhotoAnalyzer?: MealPhotoAnalyzer;
  mealPhotoRateLimiter?: RequestRateLimiter;
  audit?: AuditRecorder;
  consent?: { required: boolean; repository: ConsentRepository; policy?: ConsentPolicy };
}

function response(body: unknown, status: number, origin?: string): Response {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      ...(origin ? { 'access-control-allow-origin': origin, vary: 'origin' } : {}),
    },
  });
}

function validDashboardState(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const state = value as { history?: unknown; checkIn?: unknown };
  if (!Array.isArray(state.history) || !state.checkIn || typeof state.checkIn !== 'object') return false;
  const checkIn = state.checkIn as Record<string, unknown>;
  const inRange = (key: string, minimum: number, maximum: number) => {
    const field = checkIn[key];
    return typeof field === 'number' && Number.isFinite(field) && field >= minimum && field <= maximum;
  };
  return inRange('weightKg', 30, 300)
    && inRange('sleepScore', 0, 100)
    && inRange('sleepHours', 0, 24)
    && inRange('soreness', 0, 10)
    && inRange('stress', 0, 10);
}

function expectedRevision(request: Request): string | undefined {
  const value = request.headers.get('if-match')?.trim();
  if (!value) return undefined;
  return value.replace(/^W\//, '').replace(/^"|"$/g, '');
}

function validMealPhotoDataUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return false;
  const bytes = Buffer.from(match[2]!, 'base64');
  if (bytes.byteLength < 128 || bytes.byteLength > 700_000) return false;
  if (match[1] === 'jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (match[1] === 'png') return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
}

export function createApiHandler(dependencies: ApiDependencies) {
  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    const corsOrigin = origin && origin === dependencies.allowedOrigin ? origin : undefined;

    if (request.method === 'OPTIONS') {
      if (!corsOrigin) return response({ error: 'origin_not_allowed' }, 403);
      return new Response(null, { status: 204, headers: {
        'access-control-allow-origin': corsOrigin,
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'access-control-allow-headers': 'authorization, content-type, if-match',
        'access-control-max-age': '600',
        vary: 'origin',
      } });
    }

    if (url.pathname === '/health' && request.method === 'GET') return response({ status: 'ok', capabilities: { mealPhotoAnalysis: Boolean(dependencies.mealPhotoAnalyzer), betaEnforced: dependencies.beta?.required === true, consentEnforced: dependencies.consent?.required === true, consentPolicyApproved: (dependencies.consent?.policy ?? consentPolicy).approved } }, 200, corsOrigin);
    const user = await dependencies.auth.verify(request.headers.get('authorization'));
    if (!user) return response({ error: 'unauthorized' }, 401, corsOrigin);
    const requestId = request.headers.get('x-request-id') ?? 'direct-request';
    const auditDashboardWrite = (outcome: DashboardAuditOutcome, reason: DashboardAuditReason) => dependencies.audit?.dashboardWrite({ requestId, actorId: user.id, outcome, reason });

    const beta = dependencies.beta;
    if (url.pathname === '/v1/beta') {
      if (!beta) return response({ error: 'beta_not_configured' }, 503, corsOrigin);
      if (request.method === 'GET') return response(betaStatus(beta, await beta.repository.invitation(user.id)), 200, corsOrigin);
      if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405, corsOrigin);
      if (Number(request.headers.get('content-length') ?? 0) > 1024) return response({ error: 'payload_too_large' }, 413, corsOrigin);
      const text = await request.text();
      if (Buffer.byteLength(text) > 1024) return response({ error: 'payload_too_large' }, 413, corsOrigin);
      let body: { country?: unknown; adultConfirmed?: unknown };
      try { body = JSON.parse(text); } catch { return response({ error: 'invalid_json' }, 400, corsOrigin); }
      if (!body || body.adultConfirmed !== true || typeof body.country !== 'string' || !beta.countries.has(body.country)) return response({ error: 'beta_eligibility_incomplete' }, 400, corsOrigin);
      if (!await beta.repository.confirmAdult(user.id, body.country)) return response({ error: 'beta_invitation_required' }, 403, corsOrigin);
      return response(betaStatus(beta, await beta.repository.invitation(user.id)), 200, corsOrigin);
    }
    // Access management and deletion remain reachable after a country is paused or an invite revoked.
    const betaProtected = url.pathname === '/v1/dashboard' || url.pathname.startsWith('/v1/foods/');
    if (beta?.required && betaProtected && !(url.pathname === '/v1/dashboard' && request.method === 'DELETE')) {
      if (!betaStatus(beta, await beta.repository.invitation(user.id)).admitted) return response({ error: 'beta_access_required' }, 403, corsOrigin);
    }

    const consent = dependencies.consent;
    const policy = consent?.policy ?? consentPolicy;
    if (url.pathname === '/v1/consent/history') {
      if (!consent) return response({ error: 'consent_not_configured' }, 503, corsOrigin);
      if (request.method !== 'GET') return response({ error: 'method_not_allowed' }, 405, corsOrigin);
      const before = url.searchParams.get('before');
      if (before !== null && (!/^[1-9][0-9]{0,18}$/.test(before) || BigInt(before) > 9223372036854775807n)) return response({ error: 'invalid_cursor' }, 400, corsOrigin);
      return response(await consent.repository.history(user.id, before ?? undefined), 200, corsOrigin);
    }
    if (url.pathname === '/v1/consent') {
      if (!consent) return response({ error: 'consent_not_configured' }, 503, corsOrigin);
      if (request.method === 'GET') {
        const record = await consent.repository.latest(user.id);
        return response({ required: consent.required, approved: policy.approved, digest: policyDigest(policy), documents: policy.documents,
          accepted: hasCurrentConsent(record, policy), record }, 200, corsOrigin);
      }
      if (request.method === 'POST') {
        if (!policy.approved) return response({ error: 'consent_policy_not_approved' }, 503, corsOrigin);
        if (Number(request.headers.get('content-length') ?? 0) > 4096) return response({ error: 'payload_too_large' }, 413, corsOrigin);
        const text = await request.text();
        if (Buffer.byteLength(text) > 4096) return response({ error: 'payload_too_large' }, 413, corsOrigin);
        let body: { digest?: unknown; accepted?: unknown; locale?: unknown };
        try { body = JSON.parse(text); } catch { return response({ error: 'invalid_json' }, 400, corsOrigin); }
        if (!body || body.digest !== policyDigest(policy)) return response({ error: 'consent_version_changed' }, 409, corsOrigin);
        if (!Array.isArray(body.accepted) || body.accepted.length !== policy.documents.length
          || !policy.documents.every(doc => (body.accepted as unknown[]).includes(doc.id))) return response({ error: 'consent_incomplete' }, 400, corsOrigin);
        if (typeof body.locale !== 'string' || !/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(body.locale) || body.locale.length > 35) return response({ error: 'invalid_locale' }, 400, corsOrigin);
        await consent.repository.append(user.id, { digest: policyDigest(policy), accepted: true, recordedAt: new Date().toISOString(),
          documents: policy.documents, locale: body.locale, method: 'checkbox-and-button' });
        return response({ accepted: true }, 200, corsOrigin);
      }
      if (request.method === 'DELETE') {
        const previous = await consent.repository.latest(user.id);
        await consent.repository.append(user.id, { digest: previous?.digest ?? policyDigest(policy), accepted: false, recordedAt: new Date().toISOString(),
          documents: previous?.documents ?? [], locale: previous?.locale ?? 'und', method: 'withdrawal' });
        return response({ accepted: false }, 200, corsOrigin);
      }
      return response({ error: 'method_not_allowed' }, 405, corsOrigin);
    }
    // Deletion remains available even if consent is declined or withdrawn.
    const protectedPath = url.pathname === '/v1/dashboard' || url.pathname.startsWith('/v1/foods/');
    if (consent?.required && protectedPath && !(url.pathname === '/v1/dashboard' && request.method === 'DELETE')) {
      if (!policy.approved) return response({ error: 'consent_policy_not_approved' }, 503, corsOrigin);
      if (!hasCurrentConsent(await consent.repository.latest(user.id), policy)) return response({ error: 'consent_required' }, 403, corsOrigin);
    }

    if (url.pathname === '/v1/foods/search' && request.method === 'GET') {
      const query = (url.searchParams.get('q') ?? '').trim();
      if (query.length < 2 || query.length > 100) return response({ error: 'invalid_query' }, 400, corsOrigin);
      if (!dependencies.foodProvider) return response({ foods: [], provider: 'local-only' }, 200, corsOrigin);
      try {
        return response({ foods: await dependencies.foodProvider.search(query), provider: 'usda' }, 200, corsOrigin);
      } catch {
        return response({ error: 'food_provider_unavailable' }, 503, corsOrigin);
      }
    }

    const barcodeMatch = url.pathname.match(/^\/v1\/foods\/barcode\/(\d{8,14})$/);
    if (barcodeMatch && request.method === 'GET') {
      if (!dependencies.foodProvider) return response({ error: 'not_found' }, 404, corsOrigin);
      try {
        const food = await dependencies.foodProvider.barcode(barcodeMatch[1]!);
        return food ? response({ food }, 200, corsOrigin) : response({ error: 'not_found' }, 404, corsOrigin);
      } catch {
        return response({ error: 'food_provider_unavailable' }, 503, corsOrigin);
      }
    }

    if (url.pathname === '/v1/foods/photo-analysis' && request.method === 'POST') {
      const contentLength = Number(request.headers.get('content-length') ?? 0);
      if (contentLength > MAX_MEAL_PHOTO_BODY_BYTES) return response({ error: 'photo_too_large' }, 413, corsOrigin);
      if (!dependencies.mealPhotoAnalyzer) return response({ error: 'meal_photo_analysis_unavailable' }, 503, corsOrigin);
      const bodyText = await request.text();
      if (new TextEncoder().encode(bodyText).byteLength > MAX_MEAL_PHOTO_BODY_BYTES) return response({ error: 'photo_too_large' }, 413, corsOrigin);
      let body: { imageDataUrl?: unknown };
      try { body = JSON.parse(bodyText) as { imageDataUrl?: unknown }; }
      catch { return response({ error: 'invalid_json' }, 400, corsOrigin); }
      if (!validMealPhotoDataUrl(body.imageDataUrl)) return response({ error: 'invalid_meal_photo' }, 400, corsOrigin);
      if (dependencies.mealPhotoRateLimiter && !dependencies.mealPhotoRateLimiter.allow(user.id)) return response({ error: 'meal_photo_rate_limited' }, 429, corsOrigin);
      try {
        return response({ analysis: await dependencies.mealPhotoAnalyzer.analyze(body.imageDataUrl) }, 200, corsOrigin);
      } catch (error) {
        const reason = mealPhotoFailureReason(error);
        console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', event: 'meal_photo_analysis.failed', reason }));
        return response({ error: 'meal_photo_analysis_failed', reason }, 503, corsOrigin);
      }
    }

    if (url.pathname !== '/v1/dashboard') return response({ error: 'not_found' }, 404, corsOrigin);

    if (request.method === 'GET') {
      const dashboard = await dependencies.dashboards.get(user.id);
      return dashboard ? response(dashboard, 200, corsOrigin) : response({ error: 'not_found' }, 404, corsOrigin);
    }

    if (request.method === 'PUT') {
      const contentLength = Number(request.headers.get('content-length') ?? 0);
      if (contentLength > MAX_DASHBOARD_BYTES) {
        auditDashboardWrite('rejected', 'payload_too_large');
        return response({ error: 'payload_too_large' }, 413, corsOrigin);
      }
      try {
        const bodyText = await request.text();
        if (new TextEncoder().encode(bodyText).byteLength > MAX_DASHBOARD_BYTES) {
          auditDashboardWrite('rejected', 'payload_too_large');
          return response({ error: 'payload_too_large' }, 413, corsOrigin);
        }
        const body = JSON.parse(bodyText) as { state?: unknown };
        if (!validDashboardState(body.state)) {
          auditDashboardWrite('rejected', 'invalid_dashboard');
          return response({ error: 'invalid_dashboard' }, 400, corsOrigin);
        }
        const dashboard = await dependencies.dashboards.put(user.id, body.state, expectedRevision(request));
        auditDashboardWrite('accepted', 'saved');
        return response(dashboard, 200, corsOrigin);
      } catch (error) {
        if (error instanceof RevisionConflictError) {
          auditDashboardWrite('conflict', 'revision_conflict');
          const current = await dependencies.dashboards.get(user.id);
          return response({
            error: 'revision_conflict',
            ...(current ? { current: { revision: current.revision, updatedAt: current.updatedAt } } : {}),
          }, 412, corsOrigin);
        }
        if (error instanceof SyntaxError) {
          auditDashboardWrite('rejected', 'invalid_json');
          return response({ error: 'invalid_json' }, 400, corsOrigin);
        }
        throw error;
      }
    }

    if (request.method === 'DELETE') {
      const deleted = await dependencies.dashboards.delete(user.id);
      dependencies.audit?.dashboardDelete({ requestId, actorId: user.id, outcome: deleted ? 'deleted' : 'absent' });
      return new Response(null, { status: 204, headers: {
        'cache-control': 'no-store',
        ...(corsOrigin ? { 'access-control-allow-origin': corsOrigin, vary: 'origin' } : {}),
      } });
    }

    return response({ error: 'method_not_allowed' }, 405, corsOrigin);
  };
}
