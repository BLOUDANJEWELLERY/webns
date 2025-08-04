// src/context/CartContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'

type CartItem = {
  productId: string
  title: string
  price: number
  image?: any
  size: string
  color: string
  sku: string
  quantity: number
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (sku: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(p => p.sku === item.sku)
      if (existing) {
        return prev.map(p =>
          p.sku === item.sku ? { ...p, quantity: p.quantity + 1 } : p
        )
      }
      return [...prev, item]
    })
  }

  const removeFromCart = (sku: string) => {
    setCart(prev => prev.filter(item => item.sku !== sku))
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  )
}

// 🔥 THIS IS THE MISSING EXPORT
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}