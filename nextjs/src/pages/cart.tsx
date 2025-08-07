// pages/cart.tsx

import React from 'react'
import { createClient } from 'next-sanity'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import Header from './components/header'
import styles from '../styles/cart.module.css'

// === Sanity client setup ===
const client = createClient({
  projectId: '3jc8hsku',
  dataset: 'production',
  apiVersion: '2023-07-30',
  useCdn: false,
})

// === Fetch collection links only ===
export async function getStaticProps() {
  const collectionQuery = `*[_type == "collection"]{
    _id,
    name,
    linkTarget
  }`

  const collections = await client.fetch(collectionQuery)

  return {
    props: { collections },
    revalidate: 60,
  }
}

// === Cart Page Component ===
export default function CartPage({ collections }: { collections: any[] }) {
  const { cart, removeFromCart, updateQuantity } = useCart()

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <>
      <Header collections={collections} title="All Products" titleHref="/product" />

      {cart.length === 0 ? (
        <main className={styles.emptyCart}>
          <h1>Your Cart</h1>
          <p>Your cart is empty.</p>
        </main>
      ) : (
        <main className={styles.cartPage}>
          <h1 className={styles.title}>Your Cart</h1>

          <section className={styles.cartList}>
            {cart.map(item => (
              <article key={item.sku} className={styles.cartItem}>
                <Link href={`/product/${item.slug}`} passHref legacyBehavior>
                  <a className={styles.cartLink}>
                    <div className={styles.imageWrapper}>
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={100}
                        height={100}
                        className={styles.cartImage}
                      />
                    </div>

                    <div className={styles.cartDetails}>
                      <h3 className={styles.cartTitle}>{item.title}</h3>
                      <p className={styles.cartMeta}>
                        Size: <span>{item.size}</span> | Color: <span>{item.color}</span>
                      </p>
                      <p className={styles.cartPrice}>$ {item.price.toFixed(2)}</p>
                    </div>
                  </a>
                </Link>

                <div className={styles.cartQuantity}>
                  <button
                    className={styles.quantityButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      updateQuantity(item.sku, item.quantity - 1)
                    }}
                    disabled={item.quantity <= 1}
                    aria-label={`Decrease quantity of ${item.title}`}
                  >
                    −
                  </button>
                  <span className={styles.quantityNumber}>{item.quantity}</span>
                  <button
                    className={styles.quantityButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      updateQuantity(item.sku, item.quantity + 1)
                    }}
                    aria-label={`Increase quantity of ${item.title}`}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    removeFromCart(item.sku)
                  }}
                  className={styles.removeButton}
                  aria-label={`Remove ${item.title} from cart`}
                >
                  Remove
                </button>
              </article>
            ))}
          </section>

          <div className={styles.cartActions}>
            <Link href="/product" className={`${styles.cartButton} ${styles.continueButton}`}>
              Continue Shopping
            </Link>
            <button className={`${styles.cartButton} ${styles.checkoutButton}`}>
              Proceed to Checkout
            </button>
          </div>

          <footer className={styles.cartTotal}>
            Total: KWD {total.toFixed(2)}
          </footer>
        </main>
      )}
    </>
  )
}