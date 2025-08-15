import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

type Data = {
  success?: boolean
  error?: string
  doc?: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') return res.status(405).end()

  const { title, price, defaultImage } = req.body
  if (!title || !price) return res.status(400).json({ error: 'Missing title or price' })

  try {
    const doc = await client.create({
      _type: 'product',
      title,
      price: Number(price),
      slug: { current: title.toLowerCase().replace(/\s+/g, '-') },
      defaultImage: defaultImage || undefined, // make sure it's optional
    })
    res.status(200).json({ success: true, doc })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}