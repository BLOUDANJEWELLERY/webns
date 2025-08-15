// /pages/api/products/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

type Data = {
  success?: boolean
  error?: string
  doc?: any
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // allow large image uploads
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'PUT') return res.status(405).end()

  const { id, title, price, defaultImage, colorImages } = req.body
  if (!id) return res.status(400).json({ error: 'Missing product ID' })

  try {
    const patchData: Record<string, any> = {}

    if (title) patchData.title = title
    if (price !== undefined) patchData.price = Number(price)

    // Upload default image if provided
    if (defaultImage) {
      const imageAsset = await client.assets.upload(
        'image',
        Buffer.from(defaultImage.split(',')[1], 'base64'),
        { filename: `${title || 'product'}-default.jpg` }
      )
      patchData.defaultImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAsset._id,
        },
      }
    }

    // Upload color images if provided
    if (Array.isArray(colorImages) && colorImages.length > 0) {
      patchData.colorImages = []
      for (const { color, image } of colorImages) {
        const uploaded = await client.assets.upload(
          'image',
          Buffer.from(image.split(',')[1], 'base64'),
          { filename: `${title || 'product'}-${color}.jpg` }
        )
        patchData.colorImages.push({
          _type: 'object',
          color,
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: uploaded._id,
            },
          },
        })
      }
    }

    const doc = await client.patch(id).set(patchData).commit()

    res.status(200).json({ success: true, doc })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}