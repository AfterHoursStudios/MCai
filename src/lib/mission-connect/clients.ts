/**
 * Mission Connect Clients
 * Static client data - no external dependencies
 */

export interface MCClient {
  id: string;
  name: string;
}

// Available clients (from Mission Connect dashboard)
export const MC_CLIENTS: readonly MCClient[] = [
  { id: '9f4f613a6bdcc883', name: 'Ultimate Mission' },
  { id: 'jd8fjHkdjsdkj4k3', name: 'Gospel Outreach' },
  { id: 'sg27sox9e7djs92', name: 'Jesus 4 Asia' },
  { id: 'ncm8397ddkc62hdiz', name: 'In His Service' },
  { id: 'jdkcue348fk28fkej', name: 'Pr. Bharti N. India' },
] as const;

/**
 * Get all available clients
 */
export function getClients(): MCClient[] {
  return [...MC_CLIENTS];
}
