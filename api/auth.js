import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { nickname, telegram } = req.body;
  if (!nickname || !telegram) {
    return res.status(400).json({ error: 'Ник и Telegram обязательны' });
  }

  const existing = await kv.get(`user:${nickname}`);
  if (existing) {
    return res.json({ success: true, user: JSON.parse(existing) });
  }

  const user = {
    nickname,
    telegram,
    created: Date.now(),
    isAdmin: nickname === 'RADFLIX'
  };
  
  await kv.set(`user:${nickname}`, JSON.stringify(user));
  await kv.set(`chat:${nickname}`, JSON.stringify([]));
  
  const chats = await kv.lrange('chats', 0, -1) || [];
  if (!chats.includes(nickname)) {
    await kv.rpush('chats', nickname);
  }
  
  if (user.isAdmin) {
    await kv.set('admin', JSON.stringify(user));
  }

  return res.json({ success: true, user });
}