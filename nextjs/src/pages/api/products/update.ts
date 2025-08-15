import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

type Data = {
  success?: boolean
  error?: string
  doc?: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'PUT') return res.status(405).end()

  const { id, title, price, defaultImage } = req.body
  if (!id) return res.status(400).json({ error: 'Missing product ID' })

  try {
    const patchData: Record<string, any> = {}

    if (title) patchData.title = title
    if (price !== undefined) patchData.price = Number(price)
    if (defaultImage) patchData.defaultImage = defaultImage

    const doc = await client.patch(id)
      .set(patchData)
      .commit()

    res.status(200).json({ success: true, doc })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}