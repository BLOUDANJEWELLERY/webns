import { client } from '../../../lib/sanityClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { title, price } = req.body
  if (!title || !price) return res.status(400).json({ error: 'Missing title or price' })

  try {
    const doc = await client.create({
      _type: 'product',
      title,
      price: Number(price),
      slug: { current: title.toLowerCase().replace(/\s+/g, '-') }
    })
    res.status(200).json(doc)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}