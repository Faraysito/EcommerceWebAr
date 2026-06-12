import { useEffect, useState } from 'react'

// Determina si la tienda esta "abierta" ahora para el badge del footer.
// Calcula en minutos desde medianoche para comparar facil.
//
// OJO: horarios hardcodeados aca (no se leen de storeConfig.hours porque ese
// formato es texto libre y seria un parseo fragil). Si cambian los horarios
// hay que actualizar AMBOS lugares.
export const useStoreOpenStatus = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkIfOpen = () => {
      const now = new Date()
      const day = now.getDay() // 0=domingo ... 6=sabado
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      // Lun-Vie 09:00-19:00, Sab 10:00-14:00, Dom cerrado.
      const schedules = {
        0: null, // Domingo: cerrado
        1: { open: 9 * 60, close: 19 * 60 },
        2: { open: 9 * 60, close: 19 * 60 },
        3: { open: 9 * 60, close: 19 * 60 },
        4: { open: 9 * 60, close: 19 * 60 },
        5: { open: 9 * 60, close: 19 * 60 },
        6: { open: 10 * 60, close: 14 * 60 } // Sabado
      }

      const today = schedules[day]
      if (!today) {
        setIsOpen(false)
        return
      }
      setIsOpen(currentMinutes >= today.open && currentMinutes < today.close)
    }

    checkIfOpen()
    const interval = setInterval(checkIfOpen, 60000)
    return () => clearInterval(interval)
  }, [])

  return { isOpen, setIsOpen }
}
