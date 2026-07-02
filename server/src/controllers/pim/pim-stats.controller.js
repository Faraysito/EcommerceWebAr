import { getStats } from '../../services/pim.service.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

const getStatsController = async (req, res) => {
  const stats = await getStats()
  return res.status(HTTP_STATUS.ok).json(stats)
}

export { getStatsController }
