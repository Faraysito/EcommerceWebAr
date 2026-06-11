import styles from "./CategoryTabs.module.css";

// Tabs de categorias. Controlado: recibe activa + callback, no guarda estado.
function CategoryTabs({ categories, activeCategory, onChange }) {
  return (
    <nav className={styles.tabs} aria-label="Categorías">
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            type="button"
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
            onClick={() => onChange(category.id)}
          >
            {category.name}
          </button>
        );
      })}
    </nav>
  );
}

export default CategoryTabs;
