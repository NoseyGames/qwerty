// Vercel Edge Function – runs in every region, ~50 ms cold-start
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  let target = searchParams.get('url');
  if (!target) return new Response('?url= required', { status: 400 });

  // normalise & validate
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  try { new URL(target); } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  // stream the real site back to the user
  const r = await fetch(target, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    redirect: 'follow'
  });

  // clone response so we can rewrite the headers
  const newHdr = new Headers(r.headers);
  newHdr.set('access-control-allow-origin', '*');   // kill CORS
  newHdr.delete('content-security-policy');        // allow framing

  return new Response(r.body, {
    status: r.status,
    statusText: r.statusText,
    headers: newHdr
  });
}
