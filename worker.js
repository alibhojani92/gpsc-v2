export default {
  fetch(request, env, ctx) {
    return new Response("GPSC V2 Worker is live", { status: 200 });
  }
};
