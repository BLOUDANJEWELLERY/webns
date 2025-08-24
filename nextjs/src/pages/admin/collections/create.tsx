// src/pages/admin/create.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { GetServerSideProps } from 'next'
import { client } from '../../lib/sanityClient'
import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(client)
function urlFor(source: any) {
  return builder.image(source).url()
}

export default function CreateCollection({ products }: { products: any[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [linkTarget, setLinkTarget] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage(file)
      setImagePreview(URL.createObjectURL(file)) // local preview
    }
  }

  const handleProductSelect = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let imageAsset = null
    if (image) {
      const formData = new FormData()
      formData.append('file', image)
      formData.append('type', 'image')

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await uploadRes.json()
      if (data.asset) {
        imageAsset = { _type: 'image', asset: { _type: 'reference', _ref: data.asset._id } }
      }
    }

    const res = await fetch('/api/collections/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        linkTarget,
        image: imageAsset,
        products: selectedProducts.map((id) => ({ _ref: id })),
      }),
    })

    if (res.ok) {
      router.push('/admin/collections')
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to create collection')
    }
  }

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <h1>Create New Collection</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Collection Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label>Link Target</label>
          <input value={linkTarget} onChange={(e) => setLinkTarget(e.target.value)} />
        </div>

        <div>
          <label>Collection Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <div style={{ marginTop: '10px' }}>
              <Image src={imagePreview} alt="Preview" width={200} height={200} />
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          <label>Search Products</label>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ marginTop: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px',
                  cursor: 'pointer',
                }}
                onClick={() => handleProductSelect(product._id)}
              >
                {product.defaultImage ? (
                  <Image
                    src={urlFor(product.defaultImage).width(80).height(80).url()}
                    alt={product.title}
                    width={80}
                    height={80}
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      background: '#ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    No Image
                  </div>
                )}
                <span style={{ marginLeft: '10px' }}>
                  {product.title} {selectedProducts.includes(product._id) ? '✅' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" style={{ marginTop: '20px' }}>
          Create Collection
        </button>
      </form>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const products = await client.fetch(`
    *[_type == "product"]{
      _id,
      title,
      defaultImage
    }
  `)

  return { props: { products } }
}