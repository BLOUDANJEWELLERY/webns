// src/pages/api/collections/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, description, linkTarget, image } = req.body

    if (!name || !linkTarget) {
      return res.status(400).json({ error: 'Name and linkTarget are required' })
    }

    const doc = {
      _type: 'collection',
      name,
      description: description || '',
      linkTarget,
      image: image || null,
    }

    const created = await client.create(doc)

    res.status(200).json({ success: true, collection: created })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}