import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const reviews = await kv.get('reviews') || [];
    const parsed = typeof reviews === 'string' ? JSON.parse(reviews) : reviews;
    return res.json({ reviews: parsed });
  }
  
  if (req.method === 'POST') {
    const { nickname, text, rating, orderId } = req.body;
    if (!nickname || !text || !rating) {
      return res.status(400).json({ error: 'Недостаточно данных' });
    }

    const reviews = await kv.get('reviews') || [];
    const parsed = typeof reviews === 'string' ? JSON.parse(reviews) : reviews;
    parsed.push({
      nickname,
      text,
      rating,
      orderId: orderId || null,
      time: Date.now()
    });
    await kv.set('reviews', JSON.stringify(parsed));

    return res.json({ success: true });
  }
}