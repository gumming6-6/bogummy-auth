export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID; // 깃허브에서 받은 Client ID
  const redirect = new URL('https://github.com/login/oauth/authorize');
  redirect.searchParams.set('client_id', clientId);
  redirect.searchParams.set('scope', 'read:user');
  res.status(302).setHeader('Location', redirect.toString()).end();
}
