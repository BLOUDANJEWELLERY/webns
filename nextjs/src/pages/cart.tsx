// pages/cart.tsx
import { useContext } from 'react'
import { CartContext } from '../context/CartContext'
import styles from '../styles/cart.module.css'

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext)

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  if (cartItems.length === 0) {
    return <div className={styles.emptyCart}>Your cart is empty.</div>
  }

  return (
    <div className={styles.cartPage}>
      <h1>Your Cart</h1>
      <ul className={styles.cartList}>
        {cartItems.map((item, index) => (
          <li key={index} className={styles.cartItem}>
            <div>{item.title} - {item.size} / {item.color}</div>
            <div>Qty: {item.quantity}</div>
            <div>${(item.price * item.quantity).toFixed(2)}</div>
            <button onClick={() => removeFromCart(index)}>Remove</button>
          </li>
        ))}
      </ul>
      <div className={styles.cartTotal}>
        <strong>Total:</strong> ${totalPrice.toFixed(2)}
      </div>
      <button className={styles.clearBtn} onClick={clearCart}>Clear Cart</button>
    </div>
  )
}