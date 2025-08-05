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

      <div className={styles.cartList}>
        {cart.map(item => (
          <div key={item.sku} className={styles.cartItem}>
            <Image
              src={item.image}
              alt={item.title}
              width={100}
              height={100}
              className={styles.cartImage}
            />
            <div className={styles.cartDetails}>
              <h3>{item.title}</h3>
              <p>
                Size: {item.size} | Color: {item.color}
              </p>
              <p>KWD {item.price.toFixed(2)}</p>

              <div className={styles.cartActions}>
                <button
                  onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => removeFromCart(item.sku)}
              className={styles.removeButton}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <h2 className={styles.total}>Total: KWD {total.toFixed(2)}</h2>
    </main>
  )
}