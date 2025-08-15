// /pages/api/products/create.ts
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { title, price, defaultImage, colorImages, variants } = req.body

  if (!title || !price) return res.status(400).json({ error: 'Missing title or price' })

  try {
    const doc = await client.create({
      _type: 'product',
      title,
      price: Number(price),
      slug: { current: title.toLowerCase().replace(/\s+/g, '-') },
      defaultImage: defaultImage || undefined,
      colorImages: Array.isArray(colorImages)
        ? colorImages.map((c: any) => ({
            _type: 'object',
            color: c.color,
            image: c.image || undefined,
          }))
        : [],
      variants: Array.isArray(variants)
        ? variants.map((v: any) => ({
            _type: 'object',
            color: v.color,
            size: v.size,
            quantity: Number(v.quantity),
            priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
            sku: `${v.color}-${v.size}-${Math.floor(Math.random() * 1000000)}`, // simple SKU
          }))
        : [],
    })

    res.status(200).json({ success: true, doc })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}