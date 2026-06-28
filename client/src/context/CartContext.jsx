import { createContext, useContext, useEffect, useMemo, useState } from 'react'
// Carrito de compras PERSISTENTE (guarda en localStorage). Misma API publica
// que el original. Es el unico contexto de carrito: Header, CartModal,
// ProductCard y demas importan SIEMPRE desde aca (./context/CartContext).
//
// Para usarlo: reemplaza el import de CartProvider/useCart en main.jsx por
// este archivo, o renombra este a CartContext.jsx (haz respaldo del original).

const CartContext = createContext(null)
const STORAGE_KEY = 'ecommercewebar.cart.v1'

function linePrice(item) {
  return item.discountActive ? item.discountedPrice : item.price
}

// Carga inicial defensiva: si el JSON está corrupto, parte vacío.
function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitial)
  const [isOpen, setIsOpen] = useState(false)

  // Persiste en cada cambio del carrito.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Si localStorage no está disponible (modo privado, etc.), no rompemos.
    }
  }, [items])

  const addToCart = product => {
    setItems(prev => {
      const existing = prev.find(p => p.id === product.id)
      if (existing) {
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
