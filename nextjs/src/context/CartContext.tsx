// src/context/CartContext.tsx
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react'

type CartItem = {
  productId: string
  title: string
  price: number
  image?: any
  size: string
  color: string
  sku: string
  quantity: number
  slug: string
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (sku: string) => void
  updateQuantity: (sku: string, quantity: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const hasMounted = useRef(false)

  // ✅ Load from localStorage once on first mount
  useEffect(() => {
    const stored = localStorage.getItem('cart')
    if (stored) {
      try {
        setCart(JSON.parse(stored))
      } catch {
        setCart([])
      }
    }
    hasMounted.current = true
  }, [])

  // ✅ Save only after first mount to avoid overwriting on first load
  useEffect(() => {
    if (hasMounted.current) {
      localStorage.setItem('cart', JSON.stringify(cart))
    }
  }, [cart])

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(p => p.sku === item.sku)
      if (existing) {
        return prev.map(p =>
          p.sku === item.sku
            ? { ...p, quantity: p.quantity + item.quantity }
            : p
        )
      }
      return [...prev, item]
    })
  }

  const removeFromCart = (sku: string) => {
    setCart(prev => prev.filter(item => item.sku !== sku))
  }

  const updateQuantity = (sku: string, quantity: number) => {
    if (quantity < 1) return
    setCart(prev =>
      prev.map(item =>
        item.sku === sku ? { ...item, quantity } : item
      )
    )
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}