import { envSchema } from '../schemas/env-schema.js'

import 'dotenv/config'

const env = envSchema.parse(process.env)

export { env }
