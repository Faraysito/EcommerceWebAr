import { useState } from 'react'
import { Modal } from './Modal'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import styles from './CustomerAuthModal.module.css'

// Modal de login/registro del cliente. Un solo modal con dos modos: el usuario
// alterna entre "Iniciar sesión" y "Crear cuenta".
export default function CustomerAuthModal({ isOpen, close, onSuccess }) {
  const { login, register } = useCustomerAuth()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setName('')
    setEmail('')
    setPassword('')
    setError('')
  }

  const handleClose = () => {
    reset()
    setMode('login')
    close()
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email.trim() || password.length < 8) {
      setError('Email válido y contraseña de al menos 8 caracteres.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password })
      } else {
        await register({ email: email.trim(), password, name: name.trim() || undefined })
      }
      reset()
      onSuccess?.()
      close()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const title = mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'

  return (
    <Modal
      isOpen={isOpen}
      close={handleClose}
      title={title}
      fitContent
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        {mode === 'register' && (
          <label className={styles.field}>
            <span className={styles.label}>Nombre (opcional)</span>
            <input
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Tu nombre'
              disabled={submitting}
            />
          </label>
        )}

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder='correo@ejemplo.cl'
            disabled={submitting}
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Contraseña</span>
          <input
            className={styles.input}
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder='Mínimo 8 caracteres'
            disabled={submitting}
          />
        </label>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.submit}
          type='submit'
          disabled={submitting}
        >
          {submitting ? 'Procesando…' : title}
        </button>

        <p className={styles.switch}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type='button'
            className={styles.switchBtn}
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
          >
            {mode === 'login' ? 'Crear una' : 'Inicia sesión'}
          </button>
        </p>
      </form>
    </Modal>
  )
}
