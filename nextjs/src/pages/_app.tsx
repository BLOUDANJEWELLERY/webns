import type { AppProps } from 'next/app'
import Head from 'next/head'
import { CartProvider } from '../context/CartContext'
import { Toaster } from 'react-hot-toast'
import '../styles/details.module.css' // or your main global styles

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/favicon.PNG">
      </Head>
      <CartProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#fffaf2', // warm background
              color: '#5d4037',      // rich brown text
              border: '1px solid #d7ccc8', // soft brown border
              fontWeight: 'bold',
              fontFamily: 'inherit',
            },
            success: {
              icon: '🛒',
            },
          }}
        />
        <Component {...pageProps} />
      </CartProvider>
    </>
  )
}