import { useState } from 'react'
import { useNavigate } from 'react-router'
import storeConfig from '../config/store'
import styles from './Header.module.css'
import { IconInstagram } from './icons/IconInstagram'
import { IconFacebook } from './icons/IconFacebook'
import { IconTiktok } from './icons/IconTiktok'
import { useCart } from '../context/CartContext'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import CustomerAuthModal from './CustomerAuthModal'

function Header({ search = '', onSearch }) {
  const navigate = useNavigate()
  const { count, openCart } = useCart()
  const { customer, isAuthenticated, logout } = useCustomerAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const socials = [
    { name: 'Instagram', url: storeConfig.social.instagram, icon: <IconInstagram /> },
    { name: 'Facebook', url: storeConfig.social.facebook, icon: <IconFacebook /> },
    { name: 'TikTok', url: storeConfig.social.tiktok, icon: <IconTiktok /> }
  ]

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a
          href='/'
          className={styles.logo}
        >
          <span className={styles.logoMark}>◆</span>
          {storeConfig.name}
        </a>

        <div className={styles.searchBar}>
          <input
            type='search'
            placeholder='Buscar figuras, personajes, marcas…'
            className={styles.searchInput}
            aria-label='Buscar'
            value={search}
            onChange={e => onSearch?.(e.target.value)}
          />
          <button
            className={styles.searchBtn}
            type='button'
            aria-label='Buscar'
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
            >
              <circle
                cx='11'
                cy='11'
                r='8'
              />
              <line
                x1='21'
                y1='21'
                x2='16.65'
                y2='16.65'
              />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          <a href='/#catalogo'>Catálogo</a>
          <a href='/#footer'>Nosotros</a>
        </nav>

        <div className={styles.actions}>
          {/* Carrito */}
          <button
            className={styles.cartBtn}
            type='button'
            onClick={openCart}
            aria-label='Abrir carrito'
            title='Carrito'
          >
            <svg
              width='22'
              height='22'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle
                cx='9'
                cy='21'
                r='1'
              />
              <circle
                cx='20'
                cy='21'
                r='1'
              />
              <path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' />
            </svg>
            {count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </button>

          {/* Cuenta */}
          {isAuthenticated ? (
            <div className={styles.accountWrap}>
              <button
                className={styles.accountBtn}
                type='button'
                onClick={() => setMenuOpen(v => !v)}
                title='Mi cuenta'
              >
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                  <circle
                    cx='12'
                    cy='7'
                    r='4'
                  />
                </svg>
              </button>
              {menuOpen && (
                <div className={styles.menu}>
                  <div className={styles.menuHeader}>{customer?.name || customer?.email}</div>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/pedidos')
                    }}
                  >
                    Mis pedidos
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className={styles.loginBtn}
              type='button'
              onClick={() => setAuthOpen(true)}
            >
              Ingresar
            </button>
          )}
        </div>

        <div
          className={styles.socials}
          aria-label='Redes sociales'
        >
          {socials.map(s => (
            <a
              key={s.name}
              href={s.url}
              target='_blank'
              rel='noreferrer'
              title={s.name}
              className={styles.socialCircle}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      <CustomerAuthModal
        isOpen={authOpen}
        close={() => setAuthOpen(false)}
      />
    </header>
  )
}

export default Header
