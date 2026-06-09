import { envSchema } from '../schemas/env-schema.js'

process.loadEnvFile()

const env = envSchema.parse(process.env)

export { env }
