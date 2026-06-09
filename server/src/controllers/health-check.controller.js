import { HTTP_STATUS } from '../utils/httpStatus.js'

const healthCheckController = (req, res) => {
  return res.status(HTTP_STATUS.ok).json({ status: 'ok', timestamp: new Date().toISOString() })
}

export { healthCheckController }
