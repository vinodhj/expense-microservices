// CORS handling
export const handleCorsPreflight = (): Response => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
};

// CORS headers middleware
export const addCorsHeaders = (response: Response): Response => {
  // Add CORS headers to the response if they're not already present
  if (!response.headers.has("Access-Control-Allow-Origin")) {
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  return response;
};
