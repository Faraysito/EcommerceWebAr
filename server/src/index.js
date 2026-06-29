import app from './app.js'
import { env } from './config/env.js'

// Solo para desarrollo local. En Vercel el entrypoint es server/api/index.js
// y este archivo no se ejecuta.
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
})
