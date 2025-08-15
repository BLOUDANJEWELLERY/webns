// src/pages/api/products/uploadImage.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'
import formidable from 'formidable'
import fs from 'fs'

// Disable Next.js body parser for this route (we use formidable)
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const form = formidable({ multiples: false })

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Error parsing file upload' })

      const file = files.file as formidable.File
      if (!file || !file.filepath) return res.status(400).json({ error: 'No file provided' })

      const fileStream = fs.createReadStream(file.filepath)

      const asset = await client.assets.upload('image', fileStream, {
        filename: file.originalFilename || 'uploaded-image.png',
      })

      res.status(200).json({ assetId: asset._id, assetUrl: asset.url })
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}