export default async function handleKVSync(request: Request, env: any) {
  const token = request.headers.get("Authorization");
  if (!token || token !== env.KV_SYNC_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const data: { kv_key: string; kv_value: Record<string, any>[] } = await request.json();
    if (!data.kv_key || !data.kv_value) {
      return new Response("Missing data", { status: 400 });
    }

    const kv_key = data.kv_key;
    const kv_value = JSON.stringify(data.kv_value);

    await env.KV_CF_JWT_AUTH.put(kv_key, kv_value);

    // ✅ Fetch it back and ensure it's retrievable
    const storedValue = await env.KV_CF_JWT_AUTH.get(kv_key);
    if (storedValue === null) {
      return new Response("Value not found", { status: 404 });
    }

    return new Response("KV config updated", { status: 200 });
  } catch (error) {
    return new Response(`Failed to sync: ${error}`, { status: 500 });
  }
}
