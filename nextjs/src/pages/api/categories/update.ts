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
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { id, title, parent } = req.body

    if (!id || !title) {
      return res.status(400).json({ success: false, error: 'Missing id or title' })
    }

    // Build patch only with the fields we want to update
    const patch: Record<string, any> = { title }

    // Only update `parent` if explicitly provided (null means detach, undefined means no change)
    if (parent === null) {
      patch.parent = null
    } else if (parent) {
      patch.parent = { _type: 'reference', _ref: parent }
    }

    const result = await client.patch(id).set(patch).commit()

    return res.status(200).json({ success: true, category: result })
  } catch (err: any) {
    console.error('Update category failed:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}