/**
 * LinkedIn API - Required: LINKEDIN_ACCESS_TOKEN, LINKEDIN_ORG_ID
 */
export async function postToLinkedIn(text: string, imageUrl?: string): Promise<{ id: string }> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgId = process.env.LINKEDIN_ORG_ID;
  if (!token || !orgId) throw new Error('LinkedIn credentials not configured');
  console.log('LinkedIn post (configure credentials):', { text: text.slice(0, 100) });
  return { id: 'placeholder' };
}
