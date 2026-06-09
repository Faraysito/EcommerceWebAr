import { COOKIE_OPTIONS } from '../../utils/cookie-options.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

const logoutController = (req, res) => {
  return res
    .status(HTTP_STATUS.ok)
    .clearCookie('auth-token', COOKIE_OPTIONS)
    .json({ message: 'Close session successfully' })
}

export { logoutController }
