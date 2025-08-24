// src/pages/api/collections/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { id, name, description, linkTarget, image, products } = req.body
    if (!id || !name) return res.status(400).json({ error: 'ID and Name are required' })

    const doc = {
      name,
      description: description || '',
      linkTarget: linkTarget || '',
      image: image || null,
      products: Array.isArray(products) ? products : [],
    }

    const updated = await client.patch(id).set(doc).commit()
    res.status(200).json({ success: true, collection: updated })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update collection' })
  }
}