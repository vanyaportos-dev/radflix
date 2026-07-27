import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { nickname } = req.query;
    if (!nickname) {
      return res.status(400).json({ error: 'Nickname required' });
    }
    
    const chat = await kv.get(`chat:${nickname}`);
    const messages = chat ? JSON.parse(chat) : [];
    
    const updated = messages.map(m => {
      if (m.from === 'admin') return { ...m, read: true };
      return m;
    });
    await kv.set(`chat:${nickname}`, JSON.stringify(updated));
    
    return res.json({ messages: updated });
  }
  
  if (req.method === 'POST') {
    const { nickname, message, from } = req.body;
    if (!nickname || !message || !from) {
      return res.status(400).json({ error: 'Недостаточно данных' });
    }

    const chat = await kv.get(`chat:${nickname}`);
    const messages = chat ? JSON.parse(chat) : [];
    messages.push({ from, text: message, time: Date.now(), read: false });
    await kv.set(`chat:${nickname}`, JSON.stringify(messages));

    if (from === 'user') {
      const admin = await kv.get('admin');
      if (admin) {
        const adminData = JSON.parse(admin);
        const notifications = await kv.get(`notifications:${adminData.nickname}`) || [];
        const parsed = typeof notifications === 'string' ? JSON.parse(notifications) : notifications;
        parsed.push({
          type: 'new_message',
          from: nickname,
          message: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          read: false,
          time: Date.now()
        });
        await kv.set(`notifications:${adminData.nickname}`, JSON.stringify(parsed));
      }
    }

    return res.json({ success: true });
  }
}