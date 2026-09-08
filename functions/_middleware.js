export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname.includes('pages.dev')) {
    url.hostname = 'sovahub.org';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  const response = await context.next();
  const newHeaders = new Headers(response.headers);
  newHeaders.set('alt-svc', 'clear');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
