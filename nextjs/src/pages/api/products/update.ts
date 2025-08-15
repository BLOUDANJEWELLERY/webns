// /pages/api/products/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File as FormidableFile } from 'formidable'
import fs from 'fs'
import { client } from '../../../lib/sanityClient'

export const config = {
  api: { bodyParser: false }, // Required for formidable
}

interface Variant {
  color: string
  size: string
  quantity: number
  priceOverride?: number
  sku?: string
}

interface ColorImageField {
  color: string
  existingImage?: any
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
      // Normalize id
      let idField = fields.id
      if (Array.isArray(idField)) idField = idField[0]
      const id = idField as string
      if (!id) return res.status(400).json({ error: 'Missing product ID' })

      // Base patch data
      const patchData: Record<string, any> = {
        title: (Array.isArray(fields.title) ? fields.title[0] : fields.title) as string,
        description: (Array.isArray(fields.description) ? fields.description[0] : fields.description) as string,
        price: Number(Array.isArray(fields.price) ? fields.price[0] : fields.price),
        slug: { _type: 'slug', current: (Array.isArray(fields.slug) ? fields.slug[0] : fields.slug) as string },
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
      let colorImagesField = fields.colorImages
      if (Array.isArray(colorImagesField)) colorImagesField = colorImagesField[0]

      if (colorImagesField) {
        const parsedColors: ColorImageField[] = JSON.parse(colorImagesField)
        const finalColors: any[] = []

        for (let i = 0; i < parsedColors.length; i++) {
          const colorData: any = { color: parsedColors[i].color }

          const fileKey = `colorImageFile_${i}`
          if (files[fileKey]) {
            const file = Array.isArray(files[fileKey]) ? files[fileKey][0] : files[fileKey]
            const imageAsset = await client.assets.upload('image', fs.createReadStream(file.filepath), {
              filename: file.originalFilename || `color-${i}.jpg`,
            })
            colorData.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } }
          } else if (parsedColors[i].existingImage) {
            colorData.image = parsedColors[i].existingImage
          }

          finalColors.push(colorData)
        }

        patchData.colorImages = finalColors
      }

      // Handle variants
      let variantsField = fields.variants
      if (Array.isArray(variantsField)) variantsField = variantsField[0]

      if (variantsField) {
        const parsedVariants: Variant[] = JSON.parse(variantsField)
        patchData.variants = parsedVariants.map((v) => ({
          ...v,
          quantity: Number(v.quantity),
          priceOverride: v.priceOverride !== undefined ? Number(v.priceOverride) : undefined,
          sku: v.sku || `${v.color}-${v.size}-${Math.floor(Math.random() * 1000000)}`,
        }))
      }

      // Commit patch
      const doc = await client.patch(id).set(patchData).commit()
      res.status(200).json({ success: true, doc })
    } catch (error: any) {
      console.error(error)
      res.status(500).json({ error: error.message })
    }
  })
}