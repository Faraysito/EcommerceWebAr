import { HTTP_STATUS } from '../../utils/httpStatus.js'

// El frontend llama a esto al cargar para saber si hay sesion activa y poder
// mostrar el panel admin sin pedir login de nuevo. auth.middleware ya valido
// la cookie y dejo el payload en req.user.
const verifyController = (req, res) => {
  return res.status(HTTP_STATUS.ok).json({
    valid: true,
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    isSuperAdmin: Boolean(req.user.isSuperAdmin),
    permissions: req.user.permissions ?? []
  })
}

export { verifyController }
