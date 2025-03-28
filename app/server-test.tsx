'use server'

import { testConnection } from '@/lib/db'

export async function testDatabaseConnection() {
  try {
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('Server: Failed to connect to database')
      return { success: false, error: 'Failed to connect to database' }
    }
    console.log('Server: Database connection successful')
    return { success: true }
  } catch (error) {
    console.error('Server: Error testing database connection:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test database connection'
    }
  }
} 