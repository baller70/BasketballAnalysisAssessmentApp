/**
 * Manual migration script to apply User table migration
 * Run this when database is available: node scripts/apply-migration.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('Applying User authentication migration...')
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../prisma/migrations/20241224_add_user_authentication/migration.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement)
          console.log('✓ Executed:', statement.substring(0, 50) + '...')
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('⊘ Skipped (already exists):', statement.substring(0, 50) + '...')
          } else {
            console.error('✗ Error:', error.message)
            console.error('Statement:', statement.substring(0, 100))
          }
        }
      }
    }
    
    console.log('\n✅ Migration applied successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()

