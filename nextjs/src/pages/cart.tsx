// src/pages/cart.tsx
import React from 'react'
import { useCart } from '../context/CartContext'
import Image from 'next/image'
import styles from '../styles/cart.module.css' // optional

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart()

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )

  if (cartItems.length === 0) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Your Cart</h1>
        <p>Your cart is empty.</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ textAlign: 'center' }}>Your Cart</h1>
      <div>
        {cartItems.map(item => (
          <div
            key={item.sku}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #ccc',
              padding: '1rem 0',
            }}
          >
            <Image
              src={item.image}
              alt={item.title}
              width={100}
              height={100}
              style={{ objectFit: 'cover', marginRight: '1rem' }}
            />
            <div style={{ flex: 1 }}>
              <h3>{item.title}</h3>
              <p>
                Size: {item.size} | Color: {item.color}
              </p>
              <p>KWD {item.price.toFixed(2)}</p>
              <div>
                <button onClick={() => updateQuantity(item.sku, item.quantity - 1)} disabled={item.quantity <= 1}>
                  -
                </button>
                <span style={{ margin: '0 0.5rem' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.sku, item.quantity + 1)}>
                  +
                </button>
              </div>
            </div>
            <button
              onClick={() => removeFromCart(item.sku)}
              style={{ color: 'red', marginLeft: '1rem' }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <h2 style={{ textAlign: 'right', marginTop: '2rem' }}>
        Total: KWD {total.toFixed(2)}
      </h2>
    </main>
  )
}