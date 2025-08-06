// src/pages/cart.tsx
import React from 'react'
import { useCart } from '../context/CartContext'
import Image from 'next/image'
import Link from 'next/link'
import styles from '../styles/cart.module.css'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart()
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)

  if (cart.length === 0) {
    return (
      <main className={styles.emptyCart}>
        <h1>Your Cart</h1>
        <p>Your cart is empty.</p>
      </main>
    )
  }

  return (
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
              </a>
            </Link>

            <div className={styles.cartInfo}>
              <div className={styles.cartDetails}>
                <Link href={`/product/${item.slug}`} passHref legacyBehavior>
                  <a className={styles.cartLink}>
                    <h3 className={styles.cartTitle}>{item.title}</h3>
                    <p className={styles.cartMeta}>
                      Size: <span>{item.size}</span> | Color: <span>{item.color}</span>
                    </p>
                  </a>
                </Link>
              </div>

              <div className={styles.cartQuantity}>
                <p className={styles.cartPrice}>KWD {item.price.toFixed(2)}</p>
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

      <footer className={styles.cartTotal}>
        Total: KWD {total.toFixed(2)}
      </footer>
    </main>
  )
}