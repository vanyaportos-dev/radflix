import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { admin } = req.query;
  if (admin !== 'RADFLIX') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const chatNames = await kv.lrange('chats', 0, -1) || [];
  const chats = [];
  
  for (const name of chatNames) {
    const chatData = await kv.get(`chat:${name}`);
    const messages = chatData ? JSON.parse(chatData) : [];
    const userData = await kv.get(`user:${name}`);
    const user = userData ? JSON.parse(userData) : null;
    
    const hasUnread = messages.some(m => m.from === 'user' && !m.read);
    
    chats.push({
      nickname: name,
      user,
      messages: messages.slice(-20),
      hasUnread,
      lastMessage: messages[messages.length - 1] || null
    });
  }

  return res.json({
    chats: chats.sort((a, b) => 
      (b.lastMessage?.time || 0) - (a.lastMessage?.time || 0)
    )
  });
}