import { createContext, useContext, useMemo, useState } from 'react'

// Carrito de compras (estado en memoria, no se persiste). Guarda líneas
// { ...product, quantity }. El precio que cuenta para el total es el de oferta
// si existe (discountActive/discountedPrice los manda el backend). Aun así, el
// total REAL lo recalcula el backend en el checkout: esto es solo para mostrar.

const CartContext = createContext(null)

// Precio unitario a mostrar para una línea (respeta oferta vigente).
function linePrice(item) {
  return item.discountActive ? item.discountedPrice : item.price
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  const addToCart = product => {
    setItems(prev => {
      const existing = prev.find(p => p.id === product.id)
      if (existing) {
        // No superar el stock disponible.
        const nextQty = Math.min(existing.quantity + 1, product.stock)
        return prev.map(p => (p.id === product.id ? { ...p, quantity: nextQty } : p))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setIsOpen(true)
  }

  const removeFromCart = id => setItems(prev => prev.filter(p => p.id !== id))

  const setQuantity = (id, quantity) => {
    setItems(prev =>
      prev
        .map(p => {
          if (p.id !== id) return p
          const clamped = Math.max(0, Math.min(quantity, p.stock))
          return { ...p, quantity: clamped }
        })
        .filter(p => p.quantity > 0)
    )
  }

  const clearCart = () => setItems([])

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  const total = useMemo(() => items.reduce((acc, p) => acc + linePrice(p) * p.quantity, 0), [items])
  const count = useMemo(() => items.reduce((acc, p) => acc + p.quantity, 0), [items])

  const value = {
    items,
    isOpen,
    addToCart,
    removeFromCart,
    setQuantity,
    clearCart,
    openCart,
    closeCart,
    total,
    count
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
