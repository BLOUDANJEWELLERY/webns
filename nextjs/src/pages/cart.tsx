// pages/cart.tsx

import React, { useState, useEffect } from 'react'
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

  // Dynamically inject Bootstrap CSS ONLY on this page
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
    link.integrity = 'sha384-ENjdO4Dr2bkBIFxQpeoQZ1Pv4ylpZ9jv3paXtkKtu6ug5TOeNV6gBiFeWPGFN9Muh'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingRemoveSKU, setPendingRemoveSKU] = useState<string | null>(null)

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)

  function handleRemoveClick(sku: string) {
    setPendingRemoveSKU(sku)
    setShowConfirm(true)
  }

  function confirmRemove() {
    if (pendingRemoveSKU) {
      removeFromCart(pendingRemoveSKU)
    }
    setShowConfirm(false)
    setPendingRemoveSKU(null)
  }

  function cancelRemove() {
    setShowConfirm(false)
    setPendingRemoveSKU(null)
  }

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
                    handleRemoveClick(item.sku)
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

          {/* Bootstrap Modal for Remove Confirmation */}
          {showConfirm && (
            <div
              className="modal fade show"
              style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirmModalLabel"
            >
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="confirmModalLabel">
                      Confirm Removal
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={cancelRemove}
                    />
                  </div>
                  <div className="modal-body">
                    Are you sure you want to remove this item from your cart?
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={cancelRemove}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={confirmRemove}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </>
  )
}