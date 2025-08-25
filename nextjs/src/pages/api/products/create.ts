// /src/pages/api/products/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'
import { v4 as uuidv4 } from 'uuid'
import slugify from 'slugify'

interface ColorImage {
  _key?: string
  color: string
  image: string
}

interface Variant {
  _key?: string
  size: string
  color: string
  quantity: number
  priceOverride?: number
  sku?: string
}

interface CategoryRef {
  _key?: string
  _ref: string
}

interface ProductBody {
  title: string
  price: number
  description?: string
  defaultImage?: string
  colorImages?: ColorImage[]
  variants?: Variant[]
  categories?: CategoryRef[] | string[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    } = req.body as ProductBody

    if (!title) return res.status(400).json({ error: 'Missing title' })
    if (price === undefined) return res.status(400).json({ error: 'Missing price' })

    // Auto-generate slug
    const slug = slugify(title, { lower: true, strict: true })

    // Build product document
    const productData = {
      _type: 'product',
      title,
      price: Number(price),
      description: description || '',
      slug: { _type: 'slug', current: slug },
      defaultImage: defaultImage || null,
      colorImages: Array.isArray(colorImages)
        ? colorImages.map((c) => ({
            _key: c._key || uuidv4(),
            _type: 'colorImage',
            color: c.color,
            image: c.image,
          }))
        : [],
      variants: Array.isArray(variants)
        ? variants.map((v, index) => ({
            _key: v._key || uuidv4(),
            _type: 'variant',
            size: v.size,
            color: v.color,
            quantity: Number(v.quantity),
            priceOverride: v.priceOverride !== undefined ? Number(v.priceOverride) : undefined,
            sku:
              v.sku ||
              `${slug.toUpperCase()}-${v.color?.toUpperCase?.() || 'GEN'}-${v.size || 'NA'}-${index + 1}`,
          }))
        : [],
      categories: Array.isArray(categories)
        ? categories.map((cat) => ({
            _key: (typeof cat === 'object' && cat._key) || uuidv4(),
            _type: 'reference',
            _ref: typeof cat === 'string' ? cat : cat._ref,
          }))
        : [],
      createdAt: new Date().toISOString(),
    }

    // Create product in Sanity
    const createdDoc = await client.create(productData)

    res.status(201).json({ success: true, doc: createdDoc })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}