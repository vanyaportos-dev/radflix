import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { nickname, telegram, server, project, comment, items, total, raw } = req.body;
  if (!nickname || !items || !total) {
    return res.status(400).json({ error: 'Недостаточно данных' });
  }

  const orderId = `ORD_${Date.now()}_${Math.random().toString(36).slice(-4)}`;
  
  const order = {
    id: orderId,
    nickname,
    telegram: telegram || '—',
    server: server || '—',
    project: project || '—',
    comment: comment || '—',
    items,
    total,
    raw,
    status: 'pending',
    created: Date.now()
  };

  await kv.set(`order:${orderId}`, JSON.stringify(order));
  await kv.rpush(`orders:${nickname}`, orderId);
  await kv.rpush('all_orders', orderId);

  const admin = await kv.get('admin');
  if (admin) {
    const adminData = JSON.parse(admin);
    const notifications = await kv.get(`notifications:${adminData.nickname}`) || [];
    const parsed = typeof notifications === 'string' ? JSON.parse(notifications) : notifications;
    parsed.push({
      type: 'new_order',
      orderId,
      from: nickname,
      message: `Новый заказ от ${nickname} на ${total}₽`,
      read: false,
      time: Date.now()
    });
    await kv.set(`notifications:${adminData.nickname}`, JSON.stringify(parsed));
  }

  const chat = await kv.get(`chat:${nickname}`);
  const messages = chat ? JSON.parse(chat) : [];
  messages.push({
    from: 'system',
    text: `🛒 Заказ #${orderId.slice(-6)} создан!\nСумма: ${total}₽\nОжидайте подтверждения.`,
    time: Date.now()
  });
  await kv.set(`chat:${nickname}`, JSON.stringify(messages));

  return res.json({ success: true, orderId });
}