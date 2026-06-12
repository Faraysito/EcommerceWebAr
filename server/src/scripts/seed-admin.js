// Script para sembrar el superadmin en la tabla user.
//
// Uso:  node src/scripts/seed-admin.js
//
// Lee email y password de variables de entorno (ADMIN_EMAIL, ADMIN_PASSWORD)
// o usa los valores por defecto. Busca el rol 'admin' (debe existir; correr
// antes database/test-values.sql) y crea el usuario con la password hasheada.
// Si el usuario ya existe, no hace nada.

import 'dotenv/config'
import bcrypt from 'bcrypt'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@figura-ar.cl'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin12345'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_KEY en el .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  // 1. Buscar el rol admin
  const { data: role, error: roleError } = await supabase
    .from('role')
    .select('id')
    .eq('name', 'admin')
    .single()

  if (roleError || !role) {
    console.error('No existe el rol "admin". Corre primero database/test-values.sql')
    process.exit(1)
  }

  // 2. Ver si el usuario ya existe
  const { data: existing } = await supabase
    .from('user')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle()

  if (existing) {
    console.log(`El superadmin ${ADMIN_EMAIL} ya existe. Nada que hacer.`)
    process.exit(0)
  }

  // 3. Crear el usuario con password hasheada
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const { error: insertError } = await supabase
    .from('user')
    .insert({ email: ADMIN_EMAIL, password: passwordHash, role_id: role.id })

  if (insertError) {
    console.error('Error creando el superadmin:', insertError.message)
    process.exit(1)
  }

  console.log('✓ Superadmin creado:')
  console.log(`  email:    ${ADMIN_EMAIL}`)
  console.log(`  password: ${ADMIN_PASSWORD}`)
  console.log('  Cambia la contraseña después del primer login.')
  process.exit(0)
}

main()
