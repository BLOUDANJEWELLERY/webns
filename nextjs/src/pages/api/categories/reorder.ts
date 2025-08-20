import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, error: 'Method not allowed' })

  try {
    const { orderedIds } = req.body as { orderedIds: string[] }

    // Prepare patches to update order field
    const patches = orderedIds.map((id, index) => ({
      id,
      patch: { order: index },
    }))

    // Commit all patches in a single transaction
    const transaction = client.transaction()
    patches.forEach((p) => transaction.patch(p.id, { set: p.patch }))
    await transaction.commit()

    res.status(200).json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}