// src/pages/cart.tsx
import React from 'react'
import { useCart } from '../context/CartContext'
import Image from 'next/image'
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
              <p className={styles.cartPrice}>KWD {item.price.toFixed(2)}</p>

              <div className={styles.cartQuantity}>
                <button
                  className={styles.quantityButton}
                  onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label={`Decrease quantity of ${item.title}`}
                >
                  −
                </button>
                <span className={styles.quantityNumber}>{item.quantity}</span>
                <button
                  className={styles.quantityButton}
                  onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                  aria-label={`Increase quantity of ${item.title}`}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => removeFromCart(item.sku)}
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