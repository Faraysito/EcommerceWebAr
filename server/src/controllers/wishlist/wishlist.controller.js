import { z } from 'zod'
import {
  listWishlist,
  listWishlistIds,
  addToWishlist,
  removeFromWishlist
} from '../../services/wishlist.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

// Favoritos del cliente logueado. El id del cliente sale del JWT, nunca del body.

const myWishlistController = async (req, res) => {
  const items = await listWishlist({ customerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(items)
}

// Solo ids (para pintar el corazón en la grilla del catálogo).
const myWishlistIdsController = async (req, res) => {
  const ids = await listWishlistIds({ customerId: req.customer.id })
  return res.status(HTTP_STATUS.ok).json(ids)
}

const addController = async (req, res) => {
  const { productId } = z.object({ productId: z.uuidv4() }).parse(req.body)
  await addToWishlist({ customerId: req.customer.id, productId })
  return res.status(HTTP_STATUS.created).json({ message: 'Agregado a favoritos' })
}

const removeController = async (req, res) => {
  const { productId } = z.object({ productId: z.uuidv4() }).parse(req.params)
  await removeFromWishlist({ customerId: req.customer.id, productId })
  return res.status(HTTP_STATUS.noContent).end()
}

export { myWishlistController, myWishlistIdsController, addController, removeController }
