import { useEffect, useState } from 'react'
import { env } from '../config/env'

const App = () => {
  const [status, setStatus] = useState({})

  useEffect(() => {
    fetch(`${env.VITE_API_URL}/api/health`)
      .then(res => res.json())
      .then(data => setStatus(data))
  }, [])

  return (
    <>
      <h1>Hello World</h1>
      <p>API Status: {status?.status ? status?.status : 'down'}</p>
    </>
  )
}

export { App }
