import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    const token = (req.headers.cookie || '')
      .split(';')
      .map(s => s.trim())
      .find(s => s.startsWith('bgm_admin='))?.split('=')[1];

    if (!token) return res.status(200).json({ ok: false });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ ok: true, login: payload.login });
  } catch {
    res.status(200).json({ ok: false });
  }
}
