// src/pages/api/collections/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'Collection ID required' })

    await client.delete(id)
    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to delete collection' })
  }
}