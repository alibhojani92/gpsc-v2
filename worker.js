export default {
  fetch(request, env) {
    return new Response("GPSC V2 Worker is LIVE", {
      headers: { "content-type": "text/plain" },
    });
  },
};
