// /pages/api/products/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { client } from '../../../lib/sanityClient'

export const config = {
  api: { bodyParser: false }, // Required for formidable
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = formidable({ multiples: true })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: 'Error parsing form data' })
    }

    try {
      const id = fields.id as string
      if (!id) return res.status(400).json({ error: 'Missing product ID' })

      const patchData: Record<string, any> = {
        title: fields.title,
        description: fields.description,
        price: Number(fields.price),
        slug: { _type: 'slug', current: fields.slug },
      }

      // Handle default image
      if (files.defaultImage) {
        const file = Array.isArray(files.defaultImage) ? files.defaultImage[0] : files.defaultImage
        const imageAsset = await client.assets.upload('image', fs.createReadStream(file.filepath), {
          filename: file.originalFilename || 'default.jpg',
        })
        patchData.defaultImage = {
          _type: 'image',
          asset: { _type: 'reference', _ref: imageAsset._id },
        }
      }

      // Handle color images
      if (fields.colorImages) {
        const parsedColors = JSON.parse(fields.colorImages as string)
        const finalColorImages: any[] = []

        for (let i = 0; i < parsedColors.length; i++) {
          const colorData = { color: parsedColors[i].color }
          const fileKey = `colorImageFile_${i}`
          if (files[fileKey]) {
            const file = Array.isArray(files[fileKey]) ? files[fileKey][0] : files[fileKey]
            const imageAsset = await client.assets.upload('image', fs.createReadStream(file.filepath), {
              filename: file.originalFilename || `color-${i}.jpg`,
            })
            colorData['image'] = {
              _type: 'image',
              asset: { _type: 'reference', _ref: imageAsset._id },
            }
          }
          finalColorImages.push(colorData)
        }

        patchData.colorImages = finalColorImages
      }

      // Handle variants
      if (fields.variants) {
        patchData.variants = JSON.parse(fields.variants as string)
      }

      const doc = await client.patch(id).set(patchData).commit()
      res.status(200).json({ success: true, doc })
    } catch (error: any) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })
}