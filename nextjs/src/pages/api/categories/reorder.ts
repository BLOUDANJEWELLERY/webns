// /api/categories/reorder.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

type ReorderItem = { id: string; order: number }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` })
  }

  try {
    const { order, parentId } = req.body

    if (!Array.isArray(order) || !order.every((item: any) => item.id && typeof item.order === 'number')) {
      return res.status(400).json({ success: false, error: 'Invalid order data' })
    }

    const mutations = order.map((item: ReorderItem) => ({
      patch: {
        id: item.id,
        set: { order: item.order, parent: parentId || null },
      },
    }))

    await client.transaction(mutations).commit()
    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('Reorder error:', err)
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' })
  }
}