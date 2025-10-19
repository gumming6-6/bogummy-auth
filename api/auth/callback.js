// api/auth/callback.js
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');

    // 1) GitHub code → access_token 교환
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    }).then(r => r.json());

    const ghToken = tokenRes.access_token;
    if (!ghToken) return res.status(401).send('GitHub token exchange failed');

    // 2) 사용자 정보 조회
    const user = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${ghToken}`, 'User-Agent': 'bogummy-auth' }
    }).then(r => r.json());

    // 3) 허용된 계정만 통과
    const allowed = (process.env.ALLOWED_USERS || '').split(',').map(s => s.trim().toLowerCase());
    const login = (user.login || '').toLowerCase();
    if (!allowed.includes(login)) return res.status(403).send(`Not allowed: ${login}`);

    // 4) 통과 → 관리자 쿠키 발급 (7일)
    const token = jwt.sign({ login }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.setHeader('Set-Cookie', serialize('bgm_admin', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',     // ✅ github.io ↔ vercel.app 교차 도메인에서도 전송
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7일(초)
    }));

    // 5) 관리자 페이지로 리다이렉트
    res
      .status(302)
      .setHeader('Location', 'https://gumming6-6.github.io/bogummy/?admin=1')
      .end();

  } catch (e) {
    res.status(500).send('Error: ' + e.message);
  }
}
