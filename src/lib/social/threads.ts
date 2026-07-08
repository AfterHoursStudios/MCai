/**
 * Threads API (via Facebook Graph) - Required: THREADS_USER_ID, THREADS_ACCESS_TOKEN
 * Threads uses Meta's Graph API similar to Instagram
 */
export async function postToThreads(text: string, imageUrl?: string): Promise<{ id: string }> {
  const userId = process.env.THREADS_USER_ID;
  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!userId || !token) throw new Error('Threads credentials not configured');

  // Step 1: Create media container
  const containerParams = new URLSearchParams({
    media_type: imageUrl ? 'IMAGE' : 'TEXT',
    text: text,
    access_token: token,
  });
  if (imageUrl) {
    containerParams.append('image_url', imageUrl);
  }

  const createRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads?${containerParams.toString()}`,
    { method: 'POST' }
  );
  const createData = await createRes.json();
  if (createData.error) throw new Error(createData.error.message);
  const containerId = createData.id;

  // Step 2: Publish the container
  const publishRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${containerId}&access_token=${token}`,
    { method: 'POST' }
  );
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(publishData.error.message);

  return { id: publishData.id };
}
