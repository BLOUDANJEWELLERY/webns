// app/page.tsx
import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

const client = createClient({
    projectId: '3jc8hsku',
    dataset: 'production',
    apiVersion: '2023-07-30',
    useCdn: false,
})

const builder = imageUrlBuilder(client)
function urlFor(source: any) {
    return builder.image(source)
}

// This runs on the server — no token, no CORS issue
async function getProducts() {
    const query = `*[_type == "product"]{_id, title, price, description, image}`
    return await client.fetch(query, {}, { cache: 'no-store' }) // no-store disables static caching
}

export default async function HomePage() {
    const products = await getProducts()

    return (
        <main className="p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Our Clothing Products</h1>
            <div className="grid gap-6">
                {products.map((product: any) => (
                    <div key={product._id} className="border rounded-lg p-4 shadow">
                        <h2 className="text-xl font-semibold">{product.title}</h2>
                        <p className="text-gray-600">${product.price}</p>
                        <p className="text-sm">{product.description}</p>
                        {product.image && (
                            <img
                                src={urlFor(product.image).width(300).url()}
                                alt={product.title}
                                className="mt-2 rounded"
                            />
                        )}
                    </div>
                ))}
            </div>
        </main>
    )
}
