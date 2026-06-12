import { supabase } from '../config/supabase.js'
import { AppError } from '../utils/AppError.js'
import { HTTP_STATUS } from '../utils/httpStatus.js'

const listCategories = async () => {
  const { data, error } = await supabase
    .from('category')
    .select('id, name, created_at')
    .order('name', { ascending: true })

  if (error) {
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudieron listar las categorías')
  }

  return data
}

const createCategory = async ({ name }) => {
  const { data, error } = await supabase
    .from('category')
    .insert({ name })
    .select('id, name, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new AppError(HTTP_STATUS.conflict, 'Ya existe una categoría con ese nombre')
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo crear la categoría')
  }

  return data
}

const updateCategory = async ({ id, name }) => {
  const { data, error } = await supabase
    .from('category')
    .update({ name })
    .eq('id', id)
    .select('id, name, created_at')
    .single()

  if (error || !data) {
    if (error?.code === '23505') {
      throw new AppError(HTTP_STATUS.conflict, 'Ya existe una categoría con ese nombre')
    }
    throw new AppError(HTTP_STATUS.notFound, 'Categoría no encontrada')
  }

  return data
}

// Borra una categoria. OJO: el schema tiene FK product.category_id sin cascade,
// asi que si hay productos en la categoria, Postgres rechaza el borrado (23503).
const deleteCategory = async ({ id }) => {
  const { error } = await supabase.from('category').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new AppError(
        HTTP_STATUS.conflict,
        'No puedes eliminar una categoría que tiene productos'
      )
    }
    throw new AppError(HTTP_STATUS.internalServerError, 'No se pudo eliminar la categoría')
  }
}

export { listCategories, createCategory, updateCategory, deleteCategory }
