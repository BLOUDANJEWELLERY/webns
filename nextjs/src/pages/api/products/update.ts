// /src/pages/api/products/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { id, title, price, defaultImage, colorImages, variants } = req.body

    if (!id) return res.status(400).json({ error: 'Missing product ID' })
    if (!title) return res.status(400).json({ error: 'Missing title' })
    if (price === undefined) return res.status(400).json({ error: 'Missing price' })

    const patchData: Record<string, any> = {
      title,
      price: Number(price),
    }

    if (defaultImage) {
      // defaultImage can be {_type: 'image', asset: {_type: 'reference', _ref: '...'}}
      patchData.defaultImage = defaultImage
    }

    if (Array.isArray(colorImages)) {
      // each item: { color: string, image?: { _type: 'image', asset: { _type: 'reference', _ref } } }
      patchData.colorImages = colorImages.map((c: any) => ({
        color: c.color,
        image: c.image || undefined,
      }))
    }

    if (Array.isArray(variants)) {
      // each variant: { size, color, quantity, priceOverride?, sku? }
      patchData.variants = variants.map((v: any) => ({
        size: v.size,
        color: v.color,
        quantity: Number(v.quantity),
        priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
        sku: v.sku,
      }))
    }

    const updatedDoc = await client.patch(id).set(patchData).commit()
    res.status(200).json({ success: true, doc: updatedDoc })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}