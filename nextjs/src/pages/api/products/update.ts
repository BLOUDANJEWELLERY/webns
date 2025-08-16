// /src/pages/api/products/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'
import { v4 as uuidv4 } from 'uuid'

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

    // Default image
    if (defaultImage) patchData.defaultImage = defaultImage

    // Color images
    if (Array.isArray(colorImages)) {
      patchData.colorImages = colorImages.map((c: any) => ({
        _key: c._key || uuidv4(), // ✅ Ensure each has a _key
        color: c.color,
        image: c.image || undefined,
      }))
    }

    // Variants
    if (Array.isArray(variants)) {
      patchData.variants = variants.map((v: any) => ({
        _key: v._key || uuidv4(), // ✅ Ensure each has a _key
        size: v.size,
        color: v.color,
        quantity: Number(v.quantity),
        priceOverride: v.priceOverride !== undefined ? Number(v.priceOverride) : undefined,
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