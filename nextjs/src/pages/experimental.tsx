// pages/somepage.tsx
import FilterSortModal from "./components/filtersortmodal"
import { client } from "../lib/sanityClient"

export async function getServerSideProps() {
  const categories = await client.fetch(`
    *[_type=="category"]{
      _id,
      title,
      parent->{_id, title},
      order
    } | order(order asc)
  `)
  return { props: { categories: categories || [] } }
}

export default function SomePage({ categories }) {
  return (
    <div>
      <h1>Products Page</h1>
      <FilterSortModal initialCategories={categories} />
    </div>
  )
}