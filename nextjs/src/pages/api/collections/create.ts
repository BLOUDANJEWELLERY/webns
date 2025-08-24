// src/pages/api/collections/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

// simple slugify helper
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // spaces to -
    .replace(/&/g, '-and-') // & to 'and'
    .replace(/[^\w\-]+/g, '') // remove non-word chars
    .replace(/\-\-+/g, '-') // collapse multiple -
    .slice(0, 96) // Sanity slug max length
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, description, linkTarget, image, products } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const slug = { _type: 'slug', current: slugify(name) }

    const doc = {
      _type: 'collection',
      name,
      description: description || '',
      linkTarget: linkTarget || '',
      image: image || null,
      slug,
      products: Array.isArray(products)
        ? products.map((p: any) => ({
            _type: 'reference',
            _ref: p._ref,
            _key: `${p._ref}-${Math.random().toString(36).substr(2, 9)}`, // unique key
          }))
        : [],
    }

    const created = await client.create(doc)

    return res.status(200).json({ success: true, collection: created })
  } catch (err: any) {
    console.error('Error creating collection:', err.message)
    return res.status(500).json({ error: 'Failed to create collection' })
  }
}