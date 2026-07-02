import { z } from 'zod'
import {
  listChannels,
  getProductChannels,
  setProductChannelStatus,
  syndicate
} from '../../services/pim.service.js'
import { channelStatusSchema } from '../../schemas/pim.schema.js'
import { HTTP_STATUS } from '../../utils/httpStatus.js'

const listChannelsController = async (req, res) => {
  const channels = await listChannels()
  return res.status(HTTP_STATUS.ok).json(channels)
}

const getProductChannelsController = async (req, res) => {
  const { productId } = z.object({ productId: z.uuidv4() }).parse(req.params)
  const channels = await getProductChannels({ productId })
  return res.status(HTTP_STATUS.ok).json(channels)
}

const setProductChannelStatusController = async (req, res) => {
  const { productId } = z.object({ productId: z.uuidv4() }).parse(req.params)
  const body = channelStatusSchema.parse(req.body)
  const channels = await setProductChannelStatus({ productId, ...body })
  return res.status(HTTP_STATUS.ok).json(channels)
}

// Publica (sindica) el producto en un canal. 409 si la ficha no está lista.
const syndicateController = async (req, res) => {
  const { productId } = z.object({ productId: z.uuidv4() }).parse(req.params)
  const { channelId } = z.object({ channelId: z.uuidv4() }).parse(req.body)
  const result = await syndicate({ productId, channelId })
  return res.status(HTTP_STATUS.ok).json(result)
}

export {
  listChannelsController,
  getProductChannelsController,
  setProductChannelStatusController,
  syndicateController
}
