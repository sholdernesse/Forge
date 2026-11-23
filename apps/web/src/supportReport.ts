/** Deliberately accepts no dashboard, identity, URL, error, or storage objects. */
export function supportReport(input: { releaseSha: unknown; userAgent: string; online: boolean; at: Date }): string {
  const browser = [
    ['Edge', /Edg(?:A|iOS)?\/(\d{1,3})(?:\.|$)/],
    ['Firefox', /(?:Firefox|FxiOS)\/(\d{1,3})(?:\.|$)/],
    ['Chrome', /(?:Chrome|CriOS)\/(\d{1,3})(?:\.|$)/],
    ['Safari', /Version\/(\d{1,3})(?:\.|$).*Safari\//],
  ] as const;
  let browserLabel = 'Other / unknown';
  for (const [name, pattern] of browser) {
    const match = input.userAgent.match(pattern);
    if (match) { browserLabel = name + ' ' + match[1]; break; }
  }
  const release = typeof input.releaseSha === 'string' && /^[a-f0-9]{40}$/i.test(input.releaseSha)
    ? input.releaseSha.toLowerCase() : 'Development / unrecorded';
  return [
    'Forge support report',
    'Captured (UTC): ' + input.at.toISOString(),
    'Build: ' + release,
    'Browser: ' + browserLabel,
    'Browser connection: ' + (input.online ? 'Online (service availability not verified)' : 'Offline'),
    '',
    'Describe the action, expected result, and visible status separately.',
    'Do not include passwords, tokens, photos, or health records.',
  ].join('\n');
}
