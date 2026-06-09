import { envSchema } from '../schemas/envSchema'

const env = envSchema.parse(import.meta.env)

export { env }
