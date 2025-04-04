// CORS handling

export const getCorsOrigin = (request: Request, env: Env): string | null => {
  const requestOrigin = request.headers.get("Origin");
  if (!requestOrigin) {
    return null;
  }
  return requestOrigin;
};
export const handleCorsPreflight = (request: Request, env: Env): Response => {
  const corsOrigin = getCorsOrigin(request, env);

  const headers = new Headers();

  if (corsOrigin) {
    headers.set("Access-Control-Allow-Origin", corsOrigin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Project-Token, Authorization, apollographql-client-name, apollographql-client-version",
  );
  return new Response(null, { status: 204, headers });
};

// CORS headers middleware
export const addCorsHeaders = (request: Request, response: Response, env: Env): Response => {
  const newHeaders = new Headers(response.headers);
  const corsOrigin = getCorsOrigin(request, env);

  if (corsOrigin) {
    newHeaders.set("Access-Control-Allow-Origin", corsOrigin);
    // When using credentials, ensure the origin is explicitly set, not "*"
    newHeaders.set("Access-Control-Allow-Credentials", "true");
  }
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  newHeaders.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Project-Token, Authorization, apollographql-client-name, apollographql-client-version",
  );

  // Adding Vary header to ensure caching mechanisms differentiate responses by origin
  newHeaders.append("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
