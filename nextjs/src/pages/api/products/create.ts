// /src/pages/api/products/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'
import { v4 as uuidv4 } from 'uuid'
import slugify from 'slugify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      title,
      price,
      description,
      defaultImage,
      colorImages,
      variants,
      categories,
    } = req.body

    if (!title) return res.status(400).json({ error: 'Missing title' })
    if (price === undefined) return res.status(400).json({ error: 'Missing price' })

    // Auto-generate slug
    const slug = slugify(title, { lower: true, strict: true })

    // Build product data
    const productData: Record<string, any> = {
      _type: 'product',
      title,
      price: Number(price),
      slug: { _type: 'slug', current: slug },
    }

    if (description !== undefined) productData.description = description

    if (defaultImage) productData.defaultImage = defaultImage

    if (Array.isArray(colorImages)) {
      productData.colorImages = colorImages.map((c: any) => ({
        _key: c._key || uuidv4(),
        color: c.color,
        image: c.image,
      }))
    }

    if (Array.isArray(variants)) {
      productData.variants = variants.map((v: any, index: number) => {
        // Generate SKU if missing
        const generatedSku =
          v.sku ||
          `${slug.toUpperCase()}-${v.color?.toUpperCase?.() || 'GEN'}-${v.size || 'NA'}-${index + 1}`

        return {
          _key: v._key || uuidv4(),
          size: v.size,
          color: v.color,
          quantity: Number(v.quantity),
          priceOverride:
            v.priceOverride !== undefined ? Number(v.priceOverride) : undefined,
          sku: generatedSku,
        }
      })
    }

    if (Array.isArray(categories)) {
      productData.categories = categories.map((cat: any) => ({
        _key: cat._key || uuidv4(),
        _type: 'reference',
        _ref: typeof cat === 'string' ? cat : cat._ref,
      }))
    }

    // Create product in Sanity
    const createdDoc = await client.create(productData)

    res.status(201).json({ success: true, doc: createdDoc })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}