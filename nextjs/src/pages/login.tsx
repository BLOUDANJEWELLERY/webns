import { useState } from 'react'
import Head from 'next/head'
import styles from '../styles/login.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Replace with real authentication logic
    alert(`Logging in as ${email}`)
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