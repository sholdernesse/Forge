export interface BetaInvitation { country: string; adultConfirmedAt: string | null; revoked: boolean }
export interface BetaRepository {
  invitation(userId: string): Promise<BetaInvitation | null>;
  confirmAdult(userId: string, country: string): Promise<boolean>;
}
export interface BetaAccess { required: boolean; countries: ReadonlySet<string>; repository: BetaRepository }
export function betaRequired(environment: NodeJS.ProcessEnv): boolean {
  return environment.NODE_ENV === 'production' || environment.FORGE_BETA_REQUIRED === 'true';
}
export function betaCountries(value: string | undefined): ReadonlySet<string> {
  if (!value?.trim()) return new Set();
  const countries = value.split(',').map(country => country.trim().toUpperCase());
  if (countries.some(country => !/^[A-Z]{2}$/.test(country))) throw new Error('FORGE_BETA_COUNTRIES must contain two-letter country codes');
  return new Set(countries);
}
export function betaStatus(access: BetaAccess, invitation: BetaInvitation | null) {
  const invited = invitation !== null && !invitation.revoked;
  const countryEnabled = invited && access.countries.has(invitation.country);
  const adultConfirmed = invited && invitation.adultConfirmedAt !== null;
  return { required: access.required, invited, country: invited ? invitation.country : null, countryEnabled, adultConfirmed,
    admitted: !access.required || (invited && countryEnabled && adultConfirmed) };
}
