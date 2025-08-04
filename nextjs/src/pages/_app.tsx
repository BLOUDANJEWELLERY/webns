import type { AppProps } from 'next/app'
import { CartProvider } from '../context/CartContext' // adjust if in different folder
import '../styles/details.module.css' // or your main global styles

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  )
}