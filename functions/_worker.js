// Cloudflare Pages Functions Worker Configuration
// This file helps configure the bundler for external dependencies

export default {
  async fetch(request, env, ctx) {
    // This is handled by the Pages Functions router
    return new Response('Not Found', { status: 404 });
  }
};
