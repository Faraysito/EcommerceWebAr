import storeConfig from "../config/store";
import styles from "./Header.module.css";
import { IconInstagram } from "./icons/IconInstagram";
import { IconFacebook } from "./icons/IconFacebook";
import { IconTiktok } from "./icons/IconTiktok";

function Header() {
  const socials = [
    { name: "Instagram", url: storeConfig.social.instagram, icon: <IconInstagram /> },
    { name: "Facebook", url: storeConfig.social.facebook, icon: <IconFacebook /> },
    { name: "TikTok", url: storeConfig.social.tiktok, icon: <IconTiktok /> },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoMark}>◆</span>
          {storeConfig.name}
        </a>

        <div className={styles.searchBar}>
          <input
            type="search"
            placeholder="Buscar figuras, personajes, marcas…"
            className={styles.searchInput}
            aria-label="Buscar"
          />
          <button className={styles.searchBtn} type="button" aria-label="Buscar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          <a href="#catalogo">Catálogo</a>
          <a href="#footer">Nosotros</a>
        </nav>

        <div className={styles.socials} aria-label="Redes sociales">
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              title={s.name}
              className={styles.socialCircle}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}

export default Header;
