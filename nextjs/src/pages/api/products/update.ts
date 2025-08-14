import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { client } from '../../../lib/sanityClient'

export const config = {
  api: { bodyParser: false }, // important for file uploads
}

type Data = { success?: boolean; error?: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'PUT') return res.status(405).end()

  try {
    const form = formidable()
    const [fields, files] = await form.parse(req)

    const id = fields.id?.[0]
    const title = fields.title?.[0]
    const price = fields.price?.[0]
    let defaultImage = undefined

    if (!id) return res.status(400).json({ error: 'Missing product ID' })

    // If image file is present, upload to Sanity
    if (files.image?.[0]) {
      const file = files.image[0]
      const imageBuffer = fs.readFileSync(file.filepath)

      const asset = await client.assets.upload('image', imageBuffer, {
        filename: file.originalFilename || 'upload.jpg',
      })

      defaultImage = {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
      }
    }

    await client.patch(id)
      .set({
        ...(title && { title }),
        ...(price !== undefined && { price: Number(price) }),
        ...(defaultImage && { defaultImage }),
      })
      .commit()

    res.status(200).json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}