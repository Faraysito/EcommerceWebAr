import { HTTP_STATUS } from '../utils/httpStatus.js'

const notFound = (req, res) => {
  return res.status(HTTP_STATUS.notFound).end()
}

export { notFound }
