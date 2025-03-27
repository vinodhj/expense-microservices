/**
 * Creates a service router function that directs HTTP requests to the appropriate service
 * based on the URL. If the URL matches the user service, it forwards the request to the
 * user service worker. Otherwise, it falls back to the default fetch behavior.
 *
 * @param env - An environment configuration object containing URLs and service workers.
 * @returns A function that takes a URL and optional request options, and performs a fetch
 * operation to the corresponding service.
 */

export const createServiceRouter = (env: Env) => {
  return (url: string, options?: RequestInit) => {
    console.log("URL", url);
    console.log("env.USER_SERVICE_URL", env.USER_SERVICE_URL);
    console.log("env.USER_SERVICE_WORKER", env.USER_SERVICE_WORKER);
    console.log("env.EXPENSE_TRACKER_URL", env.EXPENSE_TRACKER_URL);
    console.log("env.EXPENSE_TRACKER_WORKER", env.EXPENSE_TRACKER_WORKER);

    // Determine which service to call based on the URL
    if (url.includes(env.USER_SERVICE_URL)) {
      return env.USER_SERVICE_WORKER.fetch(url, options);
    }

    if (url.includes(env.EXPENSE_TRACKER_URL)) {
      return env.EXPENSE_TRACKER_WORKER.fetch(url, options);
    }

    // You could add more service routing conditions here

    // Fallback to default fetch if no match
    return fetch(url, options);
  };
};
