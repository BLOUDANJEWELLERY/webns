// pages/experimental.tsx
import { GetServerSideProps } from "next"
import FilterSortModal from "./components/filtersortmodal"
import { client } from "../lib/sanityClient"

// Match your Sanity schema for categories
interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

interface ExperimentalPageProps {
  categories: CategoryRaw[]
}

export const getServerSideProps: GetServerSideProps<ExperimentalPageProps> = async () => {
  const categories: CategoryRaw[] = await client.fetch(`
    *[_type=="category"]{
      _id,
      title,
      parent->{_id, title},
      order
    } | order(order asc)
  `)

  return { props: { categories: categories || [] } }
}

export default function ExperimentalPage({ categories }: ExperimentalPageProps) {
  return (
    <div>
      <h1>Products Page</h1>
      <FilterSortModal initialCategories={categories} />
    </div>
  )
}