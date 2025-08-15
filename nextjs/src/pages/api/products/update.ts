// /src/pages/api/products/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { client } from '../../../lib/sanityClient'

export const config = {
  api: { bodyParser: false }, // Required for formidable
}

// Helper: normalize field to string
function getStringField(field: string | string[] | undefined): string | undefined {
  if (!field) return undefined
  return Array.isArray(field) ? field[0] : field
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = formidable({ multiples: true })

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing form data' })

    try {
      const id = getStringField(fields.id)
      if (!id) return res.status(400).json({ error: 'Missing product ID' })

      const patchData: Record<string, any> = {
        title: getStringField(fields.title),
        price: Number(getStringField(fields.price)),
      }

      // Handle default image
      if (files.defaultImage) {
        const defaultFile = Array.isArray(files.defaultImage)
          ? files.defaultImage[0]
          : files.defaultImage
        const imageAsset = await client.assets.upload(
          'image',
          fs.createReadStream(defaultFile.filepath),
          { filename: defaultFile.originalFilename || 'default.jpg' }
        )
        patchData.defaultImage = {
          _type: 'image',
          asset: { _type: 'reference', _ref: imageAsset._id },
        }
      }

      // Handle color images
      if (fields.colorImages) {
        const parsedColors = JSON.parse(getStringField(fields.colorImages) || '[]')
        const finalColors: any[] = []

        for (let i = 0; i < parsedColors.length; i++) {
          const colorData: any = { color: parsedColors[i].color }
          const fileKey = `colorImageFile_${i}`

          if (files[fileKey]) {
            const colorFile = Array.isArray(files[fileKey]) ? files[fileKey][0] : files[fileKey]
            const imageAsset = await client.assets.upload(
              'image',
              fs.createReadStream(colorFile.filepath),
              { filename: colorFile.originalFilename || `color-${i}.jpg` }
            )
            colorData.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } }
          } else if (parsedColors[i].image && parsedColors[i].image._ref) {
            // Keep existing image reference if no new file uploaded
            colorData.image = parsedColors[i].image
          }

          finalColors.push(colorData)
        }

        patchData.colorImages = finalColors
      }

      // Handle variants
      if (fields.variants) {
        patchData.variants = JSON.parse(getStringField(fields.variants) || '[]')
      }

      // Commit patch
      const updatedDoc = await client.patch(id).set(patchData).commit()
      res.status(200).json({ success: true, doc: updatedDoc })
    } catch (error: any) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })
}