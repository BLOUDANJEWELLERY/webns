// src/pages/api/categories/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, error: 'Method not allowed' })

  try {
    const { id, title, parent } = req.body

    const patch: any = {
      title,
    }

    if (parent) {
      patch.parent = { _type: 'reference', _ref: parent }
    } else {
      patch.parent = null
    }

    const result = await client.patch(id).set(patch).commit()

    res.status(200).json({ success: true, category: result })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}