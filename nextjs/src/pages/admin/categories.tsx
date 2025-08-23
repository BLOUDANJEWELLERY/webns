import { useState, useMemo } from 'react'
import { client } from '../../lib/sanityClient'
import styles from '../../styles/admincat.module.css'

interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

interface CategoryNode {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
  children: CategoryNode[]
}

export async function getStaticProps() {
  const categories: CategoryRaw[] = await client.fetch(`
    *[_type=="category"]{
      _id,
      title,
      parent->{_id, title},
      order
    } | order(order asc)
  `)

  return { props: { categories }, revalidate: 60 }
}

export default function CategoriesView({ categories }: { categories: CategoryRaw[] }) {
  // Build tree
  const buildCategoryTree = (cats: CategoryRaw[] = []): CategoryNode[] => {
    const map: Record<string, CategoryNode> = {}
    const roots: CategoryNode[] = []

    cats.forEach(cat => { map[cat._id] = { ...cat, children: [] } })
    cats.forEach(cat => {
      if (cat.parent?._id) map[cat.parent._id].children.push(map[cat._id])
      else roots.push(map[cat._id])
    })

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0))
      nodes.forEach(n => sortTree(n.children))
    }

    sortTree(roots)
    return roots
  }

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

  // Recursive Tree component
  const CategoryNodeItem: React.FC<{ node: CategoryNode }> = ({ node }) => {
    const [expanded, setExpanded] = useState(false)

    return (
      <div>
        <div className={styles.categoryRow}>
          {node.children.length > 0 && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setExpanded(prev => !prev)}
            >
              {expanded ? '▾' : '▸'}
            </button>
          )}
          <span>{node.title}</span>
        </div>

        {expanded && node.children.length > 0 && (
          <div className={styles.nested}>
            {node.children.map(child => (
              <CategoryNodeItem key={child._id} node={child} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h2>Categories</h2>
      <div className={styles.checkboxGroup}>
        {categoryTree.map(node => (
          <CategoryNodeItem key={node._id} node={node} />
        ))}
      </div>
    </div>
  )
}