// src/pages/api/categories/delete.ts
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
  if (req.method !== 'DELETE') return res.status(405).json({ success: false, error: 'Method not allowed' })

  try {
    const { id } = req.body

    const result = await client.delete(id)

    res.status(200).json({ success: true, deleted: result })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}