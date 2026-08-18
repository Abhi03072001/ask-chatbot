export default {
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("ok");
    }

    return Response.json({ message: "AI University Assistant test agent" });
  },