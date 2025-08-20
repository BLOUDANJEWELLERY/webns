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

// Recursive function to delete a category and its children
async function deleteCategoryAndChildren(id: string): Promise<void> {
  // Find subcategories
  const children: { _id: string }[] = await client.fetch(
    `*[_type == "category" && parent._ref == $id]{ _id }`,
    { id }
  )

  // Recursively delete children
  for (const child of children) {
    await deleteCategoryAndChildren(child._id)
  }

  // Delete this category
  await client.delete(id)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { id } = req.body
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing category id' })
    }

    await deleteCategoryAndChildren(id)

    return res.status(200).json({ success: true, message: 'Category and subcategories deleted' })
  } catch (err: any) {
    console.error('Recursive delete failed:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}