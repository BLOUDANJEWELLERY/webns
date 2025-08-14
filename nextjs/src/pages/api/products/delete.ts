import { client } from '../../../lib/sanityClient'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end()

  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'Missing product ID' })

  try {
    await client.delete(id)
    res.status(200).json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}