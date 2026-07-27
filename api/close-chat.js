import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { nickname, admin } = req.body;
  if (admin !== 'RADFLIX') {
    return res.status(403).json({ error: 'Access denied' });
  }

  await kv.del(`chat:${nickname}`);
  
  const chats = await kv.lrange('chats', 0, -1) || [];
  const index = chats.indexOf(nickname);
  if (index > -1) {
    await kv.lrem('chats', 1, nickname);
  }

  return res.json({ success: true });
}