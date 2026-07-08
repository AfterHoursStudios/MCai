/**
 * Facebook API Integration
 * Required: FACEBOOK_PAGE_ID, FACEBOOK_ACCESS_TOKEN
 */
export async function postToFacebook(text: string, imageUrl?: string): Promise<{ id: string }> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!pageId || !accessToken) throw new Error('Facebook credentials not configured');

  const endpoint = imageUrl
    ? `https://graph.facebook.com/${pageId}/photos`
    : `https://graph.facebook.com/${pageId}/feed`;

  const params = new URLSearchParams({ access_token: accessToken, message: text });
  if (imageUrl) params.append('url', imageUrl);

  const res = await fetch(endpoint, { method: 'POST', body: params });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.id || data.post_id };
}
