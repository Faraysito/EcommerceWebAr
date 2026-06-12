// Footer del catalogo. Replica la estructura de Route 66, adaptada a tienda:
//   1. Brand: logo/nombre + tagline (+ redes en mobile)
//   2. Info: contacto + horarios + badge "abierto/cerrado" en vivo
//   3. Links: navegacion interna + redes (en desktop)
//   4. Mapa de Google embebido (direccion de Coquimbo)

import storeConfig from '../config/store'
import { useStoreOpenStatus } from '../hooks/useStoreOpenStatus'
import styles from './Footer.module.css'
import { IconInstagram } from './icons/IconInstagram'
import { IconFacebook } from './icons/IconFacebook'
import { IconTiktok } from './icons/IconTiktok'

// El bloque de redes se renderea dos veces (mobile en brand, desktop en
// Links). CSS oculta cada uno segun viewport.
function SocialList({ links }) {
  return (
    <ul
      className={styles.socialList}
      aria-label='Redes sociales'
    >
      {links.map(social => (
        <li key={social.name}>
          <a
            href={social.url}
            target='_blank'
            rel='noreferrer'
            className={styles.socialItem}
          >
            <span
              className={styles.socialIcon}
              aria-hidden='true'
            >
              {social.icon}
            </span>
            <span>{social.name}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function Footer() {
  const { isOpen } = useStoreOpenStatus()
  const year = new Date().getFullYear()

  const socialLinks = [
    { name: 'Instagram', url: storeConfig.social.instagram, icon: <IconInstagram /> },
    { name: 'Facebook', url: storeConfig.social.facebook, icon: <IconFacebook /> },
    { name: 'TikTok', url: storeConfig.social.tiktok, icon: <IconTiktok /> }
  ]

  return (
    <footer
      className={styles.siteFooter}
      id='footer'
    >
      <div className={styles.footerBrandCol}>
        <h3 className={styles.footerBrand}>{storeConfig.name}</h3>
        <p className={styles.footerTagline}>{storeConfig.tagline}</p>
        <div className={styles.socialListMobile}>
          <SocialList links={socialLinks} />
        </div>
      </div>

      <div className={styles.footerInfoCol}>
        <section className={styles.footerBlock}>
          <h5>Contacto</h5>
          <ul className={styles.footerContactList}>
            <li>{storeConfig.contact.address}</li>
            <li>{storeConfig.contact.phone}</li>
            <li>{storeConfig.contact.email}</li>
          </ul>
        </section>

        <section className={styles.footerBlock}>
          <div className={styles.hoursHeader}>
            <h5 className={styles.footerSubtitle}>Horarios</h5>
            <span
              className={`${styles.statusBadge} ${isOpen ? styles.statusOpen : styles.statusClosed}`}
            >
              <span className={styles.statusDot} />
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
          <ul className={styles.footerHoursList}>
            {storeConfig.hours.map(h => (
              <li key={h.days}>
                {h.days}: {h.time}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.footerLinksCol}>
        <section className={styles.footerBlock}>
          <h5>Enlaces</h5>
          <ul className={styles.footerLinksList}>
            <li>
              <a href='#catalogo'>Catálogo</a>
            </li>
            <li>
              <a href='#footer'>Sobre nosotros</a>
            </li>
            <li>
              <a
                href={`https://wa.me/${storeConfig.contact.whatsappNumber}`}
                target='_blank'
                rel='noreferrer'
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </section>

        <section className={styles.footerBlock}>
          <h5 className={styles.footerSubtitle}>Redes</h5>
          <SocialList links={socialLinks} />
        </section>
      </div>

      <div className={styles.footerMapCol}>
        <h5>Ubicación</h5>
        <div className={styles.footerMapFrame}>
          <iframe
            title={`Mapa ${storeConfig.name}`}
            src={storeConfig.links.mapEmbed}
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
          />
        </div>
      </div>

      <div className={styles.footerBottom}>
        © {year} {storeConfig.name}. Todos los derechos reservados.
      </div>
    </footer>
  )
}

export default Footer
