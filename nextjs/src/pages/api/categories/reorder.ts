// /api/categories/reorder.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')
  try {
    const { order } = req.body
    if (!Array.isArray(order)) throw new Error('Invalid order data')

    const mutations = order.map((c: { id: string; order: number }) => ({
      patch: {
        id: c.id,
        set: { order: c.order },
      },
    }))

    await client.transaction(mutations).commit()
    res.status(200).json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}