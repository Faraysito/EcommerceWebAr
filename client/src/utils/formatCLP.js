// Formatea un número a pesos chilenos: 39990 -> "$39.990".
export function formatCLP(value) {
  if (value === null || value === undefined || value === '') return ''
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return String(value)
  return '$' + parseInt(digits, 10).toLocaleString('es-CL')
}
