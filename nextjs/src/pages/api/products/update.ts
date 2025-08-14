import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

type Data = { success?: boolean; error?: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'PUT') return res.status(405).end()

  const { id, title, price, defaultImage } = req.body
  if (!id) return res.status(400).json({ error: 'Missing product ID' })

  try {
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