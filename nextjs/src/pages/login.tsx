import { useState } from 'react'
import Head from 'next/head'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import styles from '../styles/Login.module.css'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (res?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/') // Redirect to homepage on successful login
    }
  }

  return (
    <>
      <Head>
        <title>Login | Marvello Threads</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your account</p>

          {error && <p className={styles.error}>{error}</p>}

          <form onSubmit={handleLogin} className={styles.form}>
            <label className={styles.label}>
              Email
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Password
              <input
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button type="submit" className={styles.button}>
              Login
            </button>

            <p className={styles.register}>
              Don&apos;t have an account? <a href="#">Register</a>
            </p>
          </form>
        </div>
      </main>
    </>
  )
}