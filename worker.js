export default {
  async fetch(request, env) {
    try {
      // Simple health check
      if (request.method !== "GET") {
        return new Response("Only GET allowed", { status: 405 });
      }

      // DB connectivity test (read-only)
      const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table';"
      ).all();

      return new Response(
        JSON.stringify({
          status: "OK",
          message: "GPSC V2 Worker is running",
          tables: result.results.map(r => r.name),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({
          status: "ERROR",
          error: err.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
