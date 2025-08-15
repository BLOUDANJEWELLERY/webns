import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const file = req.body

    if (!file || !file.base64) {
      return res.status(400).json({ error: 'No image provided' })
    }

    const buffer = Buffer.from(file.base64, 'base64')

    const asset = await client.assets.upload('image', buffer, {
      filename: file.filename || 'uploaded-image.png',
    })

    res.status(200).json({ assetId: asset._id, assetUrl: asset.url })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}