/**
 * Instagram API (via Facebook Graph) - Required: INSTAGRAM_ACCOUNT_ID, FACEBOOK_ACCESS_TOKEN
 */
export async function postToInstagram(text: string, imageUrl?: string): Promise<{ id: string }> {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!accountId || !token || !imageUrl) throw new Error('Instagram credentials not configured');

  // Step 1: Create media container
  const createRes = await fetch(`https://graph.facebook.com/${accountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(text)}&access_token=${token}`, { method: 'POST' });
  const { id: containerId } = await createRes.json();

  // Step 2: Publish
  const publishRes = await fetch(`https://graph.facebook.com/${accountId}/media_publish?creation_id=${containerId}&access_token=${token}`, { method: 'POST' });
  const data = await publishRes.json();
  return { id: data.id };
}
