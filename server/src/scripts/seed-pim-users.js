// Script para sembrar los usuarios de la demo del PIM (Weseller).
//
// Uso:  node src/scripts/seed-pim-users.js
//
// Crea a paula.fritz@virtualizar.cl y Pablo.troncoso@virtualizar.cl con rol
// 'admin' (superadmin -> acceso total, incluido el PIM). Requiere que exista el
// rol 'admin' (correr database/02-test-values.sql antes) y las migraciones PIM.
// Idempotente: si un usuario ya existe, no lo toca.

import 'dotenv/config'
import bcrypt from 'bcrypt'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY

// Contraseña por defecto (cámbiala tras el primer login). Se puede sobreescribir
// con PIM_DEMO_PASSWORD en el .env.
const DEMO_PASSWORD = process.env.PIM_DEMO_PASSWORD || 'Weseller2025'

const USERS = ['paula.fritz@virtualizar.cl', 'Pablo.troncoso@virtualizar.cl']

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_KEY en el .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  const { data: role, error: roleError } = await supabase
    .from('role')
    .select('id')
    .eq('name', 'admin')
    .single()

  if (roleError || !role) {
    console.error('No existe el rol "admin". Corre primero database/02-test-values.sql')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  for (const email of USERS) {
    const { data: existing } = await supabase
      .from('user')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      console.log(`• ${email} ya existe. Se omite.`)
      continue
    }

    const { error } = await supabase
      .from('user')
      .insert({ email, password: passwordHash, role_id: role.id })

    if (error) {
      console.error(`Error creando ${email}:`, error.message)
      process.exit(1)
    }
    console.log(`✓ Creado ${email}`)
  }

  console.log('')
  console.log('Credenciales de acceso al PIM (/admin/login):')
  console.log(`  password: ${DEMO_PASSWORD}`)
  console.log('  Cambia la contraseña después del primer login.')
  process.exit(0)
}

main()
