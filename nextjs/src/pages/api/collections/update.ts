// src/pages/api/collections/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id, name, slug, description, linkTarget, image, products } = req.body

    if (!id) return res.status(400).json({ error: 'Collection ID is required' })
    if (!name) return res.status(400).json({ error: 'Collection name is required' })

    // Ensure slug is valid
    const finalSlug = slug?.current || {
      _type: 'slug',
      current: name
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/&/g, '-and-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '')
        .slice(0, 96),
    }

    // Prepare products array with unique _key
    const productsRef = Array.isArray(products)
      ? products.map((p: any) => ({
          _type: 'reference',
          _ref: p._ref,
          _key: p._key || `${p._ref}-${Math.random().toString(36).substr(2, 9)}`,
        }))
      : []

    const updatedDoc = {
      name,
      slug: finalSlug,
      description: description || '',
      linkTarget: linkTarget || '',
      image: image || null,
      products: productsRef,
    }

    const updated = await client
      .patch(id)
      .set(updatedDoc)
      .commit({ returnDocuments: true })

    return res.status(200).json({ success: true, collection: updated })
  } catch (err: any) {
    console.error('Error updating collection:', err.message)
    return res.status(500).json({ error: 'Failed to update collection' })
  }
}