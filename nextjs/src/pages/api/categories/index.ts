// ./src/pages/api/categories/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanityClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Fetch all categories with parent info and order
      const query = `*[_type == "category"]{
        _id,
        title,
        order,
        parent->{ _id, title }
      } | order(order asc)` // Sort by order ascending
      const categories = await client.fetch(query)
      return res.status(200).json(categories)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}