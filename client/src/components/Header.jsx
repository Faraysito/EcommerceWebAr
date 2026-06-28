import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import storeConfig from '../config/store'
import styles from './Header.module.css'
import { IconInstagram } from './icons/IconInstagram'
import { IconFacebook } from './icons/IconFacebook'
import { IconTiktok } from './icons/IconTiktok'
import { useCart } from '../context/CartContext'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { getCategories } from '../services/categories/getCategories'
import CustomerAuthModal from './CustomerAuthModal'

// Header estilo marketplace (AliExpress) con identidad HubLabExpress:
//   - fila 1: logo + buscador protagónico + cuenta + carrito
//   - fila 2: barra de categorías con mega-menú desplegable
function Header({ search = '', onSearch }) {
  const navigate = useNavigate()
  const { count, openCart } = useCart()
  const { customer, isAuthenticated, logout } = useCustomerAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [localSearch, setLocalSearch] = useState(search)
  const megaRef = useRef(null)

  // Categorías para el mega-menú.
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  // Cierra el mega-menú al hacer click afuera.
  useEffect(() => {
    const onClick = e => {
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

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

  // El buscador del catálogo se controla con onSearch (en otras páginas no hay,
  // así que al buscar vamos al home con el término).
  const submitSearch = e => {
    e.preventDefault()
    if (onSearch) onSearch(localSearch)
    else navigate(`/?q=${encodeURIComponent(localSearch)}`)
  }

  const goCategory = catId => {
    setMegaOpen(false)
    navigate(`/?cat=${catId}`)
  }

  return (
    <header className={styles.header}>
      {/* Fila 1: marca + buscador + acciones */}
      <div className={styles.top}>
        <div className={styles.inner}>
          <a
            href='/'
            className={styles.logo}
          >
            <span
              className={styles.logoMark}
              aria-hidden='true'
            >
              <svg
                width='26'
                height='26'
                viewBox='0 0 24 24'
                fill='none'
              >
                <circle
                  cx='12'
                  cy='12'
                  r='9'
                  stroke='url(#hl)'
                  strokeWidth='2'
                />
                <circle
                  cx='12'
                  cy='12'
                  r='3.5'
                  fill='url(#hl)'
                />
                <defs>
                  <linearGradient
                    id='hl'
                    x1='3'
                    y1='3'
                    x2='21'
                    y2='21'
                  >
                    <stop stopColor='#22d3ee' />
                    <stop
                      offset='1'
                      stopColor='#2f7df6'
                    />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className={styles.logoText}>
              Hublab<span className={styles.logoAccent}>Express</span>
            </span>
          </a>

          <form
            className={styles.searchBar}
            onSubmit={submitSearch}
          >
            <input
              type='search'
              placeholder='Buscar productos, figuras, marcas…'
              className={styles.searchInput}
              aria-label='Buscar'
              value={localSearch}
              onChange={e => {
                setLocalSearch(e.target.value)
                onSearch?.(e.target.value)
              }}
            />
            <button
              className={styles.searchBtn}
              type='submit'
              aria-label='Buscar'
            >
              <svg
                width='20'
                height='20'
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
          </form>

          <div className={styles.actions}>
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
                  <span className={styles.accountName}>{customer?.name || 'Mi cuenta'}</span>
                </button>
                {menuOpen && (
                  <div className={styles.menu}>
                    <div className={styles.menuHeader}>{customer?.name || customer?.email}</div>
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/vender')
                      }}
                    >
                      {customer?.isSeller ? 'Mi tienda' : 'Vender'}
                    </button>
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
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/favoritos')
                      }}
                    >
                      Favoritos
                    </button>
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/cuenta')
                      }}
                    >
                      Mi cuenta
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

            <button
              className={styles.cartBtn}
              type='button'
              onClick={openCart}
              aria-label='Abrir carrito'
              title='Carrito'
            >
              <svg
                width='24'
                height='24'
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
          </div>
        </div>
      </div>

      {/* Fila 2: categorías + mega-menú */}
      <div className={styles.catbar}>
        <div className={styles.catInner}>
          <div
            className={styles.megaWrap}
            ref={megaRef}
          >
            <button
              className={styles.megaTrigger}
              onClick={() => setMegaOpen(v => !v)}
              aria-expanded={megaOpen}
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
                <line
                  x1='3'
                  y1='6'
                  x2='21'
                  y2='6'
                />
                <line
                  x1='3'
                  y1='12'
                  x2='21'
                  y2='12'
                />
                <line
                  x1='3'
                  y1='18'
                  x2='21'
                  y2='18'
                />
              </svg>
              Todas las categorías
            </button>
            {megaOpen && (
              <div className={styles.mega}>
                {categories.length === 0 ? (
                  <div className={styles.megaEmpty}>Cargando categorías…</div>
                ) : (
                  <div className={styles.megaGrid}>
                    {categories.map(c => (
                      <button
                        key={c.id}
                        className={styles.megaItem}
                        onClick={() => goCategory(c.id)}
                      >
                        <span className={styles.megaDot} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <nav className={styles.catNav}>
            <a href='/'>Inicio</a>
            <a href='/tiendas'>Tiendas</a>
            {categories.slice(0, 5).map(c => (
              <a
                key={c.id}
                href={`/?cat=${c.id}`}
              >
                {c.name}
              </a>
            ))}
            <a
              href='/vender'
              className={styles.sellLink}
            >
              Vender
            </a>
          </nav>

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
      </div>

      <CustomerAuthModal
        isOpen={authOpen}
        close={() => setAuthOpen(false)}
      />
    </header>
  )
}

export default Header
