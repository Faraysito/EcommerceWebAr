import { WebpayPlus, Options } from 'transbank-sdk'
import { env } from '../config/env.js'

const options = new Options(
  env.TRANSBANK_COMMERCE_CODE,
  env.TRANSBANK_API_KEY,
  env.TRANSBANK_ENVIRONMENT
)

const initTransaction = async ({ buyOrder, sessionId, amount, returnUrl }) => {
  const tx = new WebpayPlus.Transaction(options)
  const res = await tx.create(buyOrder, sessionId, amount, returnUrl)

  return res
}

const commitTransaction = async ({ token }) => {
  const tx = new WebpayPlus.Transaction(options)
  const res = await tx.commit(token)

  return res
}

const statusTransaction = async ({ token }) => {
  const tx = new WebpayPlus.Transaction(options)
  const res = await tx.status(token)

  return res
}

export { initTransaction, commitTransaction, statusTransaction }
