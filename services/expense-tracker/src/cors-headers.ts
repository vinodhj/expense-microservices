// Helper to escape regex special characters in a string
const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Helper to determine the proper CORS origin based on the request with subdomain matching
export const getCorsOrigin = (request: Request, env: Env): string | null => {
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()) : [];
  const requestOrigin = request.headers.get("Origin");
  // console.log("requestOrigin", requestOrigin);
  // console.log("headers", request.headers);
  if (!requestOrigin) {
    return null;
  }

  for (const allowed of allowedOrigins) {
    // If no wildcard is present, do an exact match.
    if (allowed.indexOf("*") === -1) {
      if (allowed === requestOrigin) {
        return requestOrigin;
      }
    } else {
      const regexStr = "^" + allowed.split("*").map(escapeRegExp).join(".*") + "$";
      const regex = new RegExp(regexStr, "i"); // case-insensitive
      if (regex.test(requestOrigin)) {
        return requestOrigin;
      }
    }
  }
  return null;
};

export const addCORSHeaders = (request: Request, response: Response, env: Env): Response => {
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

// Handle CORS preflight request
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
