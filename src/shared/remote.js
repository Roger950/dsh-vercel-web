// Explicit carrier-neutral contracts: desktop IPC and web use the same methods.
const json = { mode: 'src-json' }
export const remoteContribution = {
  package: 'dsh-vercel-web',
  descriptors: [
    ['status', []], ['saveKey', ['value']], ['probe', ['operation']],
  ].map(([method, parameters]) => ({
    id: `dsh-vercel-web#vercelWeb/${method}`,
    service: 'vercelWeb', namespace: 'vercelWeb', method,
    invocation: { kind: 'direct' },
    parameters: parameters.map(name => ({ name, wire: name, source: 'json', codec: json })),
    ...(method === 'probe' ? { cancellation: { parameter: 'signal' } } : {}),
    result: json,
  })),
}
