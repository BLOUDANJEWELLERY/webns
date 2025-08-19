import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

type Data = {
  success?: boolean
  error?: string
  doc?: any
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { title, description, parent } = req.body
  if (!title) return res.status(400).json({ error: 'Category name is required' })

  try {
    const doc = await client.create({
      _type: 'category',
      title: title.trim(),
      description: description?.trim() || '',
      parent: parent ? { _type: 'reference', _ref: parent } : undefined,
    })

    res.status(200).json({ success: true, doc })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}