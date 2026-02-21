/* global URL, Request */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Static assets (file extension) - serve directly
    if (path.match(/\.\w+$/)) {
      return env.ASSETS.fetch(request);
    }

    // SPA routes - serve the correct index.html via directory path
    if (path.startsWith("/party-protocol")) {
      return env.ASSETS.fetch(new Request(new URL("/party-protocol/", url.origin)));
    }
    if (path.startsWith("/create")) {
      return env.ASSETS.fetch(new Request(new URL("/create/", url.origin)));
    }
    if (path.startsWith("/partybid")) {
      return env.ASSETS.fetch(new Request(new URL("/partybid/", url.origin)));
    }

    // Default: landing page
    return env.ASSETS.fetch(request);
  }
};
