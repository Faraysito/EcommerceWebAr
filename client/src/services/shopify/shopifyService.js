import { apiGet, apiPost, apiUpload } from '../api'

// Servicio de asociación modelo AR <-> producto Shopify (Etapa 3).

// Productos de la tienda conectada (Etapa 2).
export const getShopifyProducts = () => apiGet('/customer/shopify/products')

// Modelos 3D ya subidos, para reusar.
export const getModels = () => apiGet('/customer/models')

// Qué productos Shopify ya tienen modelo asignado: { shop, assignments: {gid:{...}} }.
export const getAssignments = () => apiGet('/customer/shopify/assignments')

// Asigna un modelo existente + medidas a un producto Shopify.
export const assignModel = payload => apiPost('/customer/shopify/assign', payload)

// Quita la asignación de un producto. Usa POST (apiDelete del cliente no manda body).
export const unassignModel = shopifyProductGid =>
  apiPost('/customer/shopify/unassign', { shopifyProductGid })

// Sube un .glb nuevo (reusa el endpoint existente del vendedor) y devuelve
// { id, name, url } del modelo creado, listo para asignar.
export const uploadModel = (file, name) => apiUpload('/customer/seller/models', file, name)
