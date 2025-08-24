// src/pages/api/collections/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, description, linkTarget, image, products } = req.body

    if (!name || !linkTarget) {
      return res.status(400).json({ error: 'Name and linkTarget are required' })
    }

    const doc = {
      _type: 'collection',
      name,
      description: description || '',
      linkTarget,
      image: image || null,
      products: Array.isArray(products) ? products : [],
    }

    const created = await client.create(doc)

    return res.status(200).json({ success: true, collection: created })
  } catch (err: any) {
    console.error('Error creating collection:', err.message)
    return res.status(500).json({ error: 'Failed to create collection' })
  }
}