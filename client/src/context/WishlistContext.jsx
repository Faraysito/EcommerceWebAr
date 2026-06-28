import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useCustomerAuth } from './CustomerAuthContext'
import {
  getWishlistIds,
  addToWishlist as addReq,
  removeFromWishlist as removeReq
} from '../services/wishlist/wishlistService'

// Estado global de favoritos. Guarda un Set de productIds para pintar el
// corazón en cualquier card. Se sincroniza con el backend cuando hay sesión;
// si no hay sesión, el toggle pide login (lo decide el componente que llama).

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useCustomerAuth()
  const [ids, setIds] = useState(() => new Set())
  const [loading, setLoading] = useState(false)

  // Al loguearse, trae los favoritos. Al desloguearse, limpia.
  useEffect(() => {
    let active = true
    if (!isAuthenticated) {
      setIds(new Set())
      return
    }
    setLoading(true)
    getWishlistIds()
      .then(list => {
        if (active) setIds(new Set(list))
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isAuthenticated])

  const isFavorite = useCallback(productId => ids.has(productId), [ids])

  // Devuelve true si quedó en favoritos, false si se quitó. Lanza si no hay
  // sesión, para que el caller abra el modal de login.
  const toggleFavorite = useCallback(
    async productId => {
      if (!isAuthenticated) throw new Error('Inicia sesión para guardar favoritos')

      const wasFav = ids.has(productId)
      // Optimista: actualiza la UI antes de la respuesta.
      setIds(prev => {
        const next = new Set(prev)
        if (wasFav) next.delete(productId)
        else next.add(productId)
        return next
      })

      try {
        if (wasFav) await removeReq(productId)
        else await addReq(productId)
        return !wasFav
      } catch (err) {
        // Revierte si falló.
        setIds(prev => {
          const next = new Set(prev)
          if (wasFav) next.add(productId)
          else next.delete(productId)
          return next
        })
        throw err
      }
    },
    [ids, isAuthenticated]
  )

  const value = { ids, loading, isFavorite, toggleFavorite, count: ids.size }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist debe usarse dentro de <WishlistProvider>')
  return ctx
}
