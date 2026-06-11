import { HTTP_STATUS } from '../utils/httpStatus.js'
import { AppError } from '../utils/AppError.js'

// Factory que devuelve un middleware para chequear un permiso concreto.
// Uso: router.post('/products', auth, requirePermission('product.create'), ctrl)
//
// El rol 'admin' (superadmin) bypasea cualquier check: su token lleva
// isSuperAdmin = true. El resto se valida contra el array de permisos que se
// firmo en el login (req.user.permissions, ej. ['product.read', ...]).
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.unauthorized, 'No autenticado')
    }

    // Superadmin: acceso total
    if (req.user.isSuperAdmin) return next()

    const permissions = req.user.permissions ?? []
    if (permissions.includes(permission)) return next()

    throw new AppError(HTTP_STATUS.unauthorized, `No tienes permiso para: ${permission}`)
  }
}

export { requirePermission }
