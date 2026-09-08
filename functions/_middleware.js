export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname.includes('pages.dev')) {
    url.hostname = 'sovahub.org';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
