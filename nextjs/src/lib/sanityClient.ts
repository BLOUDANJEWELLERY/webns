import { createClient } from 'next-sanity'

export const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // server-side only
})