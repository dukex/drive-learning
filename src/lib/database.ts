/**
 * Database utility functions for subscription system
 * Provides centralized database connection and error handling
 */

import Database from 'better-sqlite3';
import path from 'path';

// Database file path (same as used in auth.ts)
const DB_PATH = path.join(process.cwd(), 'database.sqlite');

/**
 * Custom database error class for better error handling
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public constraint?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Get database instance with proper configuration
 */
export function getDatabase(): Database.Database {
  const db = new Database(DB_PATH);
  
  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');
  
  // Set WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');
  
  return db;
}

/**
 * Handle SQLite database errors and convert to DatabaseError
 */
export function handleDatabaseError(error: any): DatabaseError {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new DatabaseError(
      'Record already exists',
      'DUPLICATE_ENTRY',
      error.message
    );
  }
  
  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new DatabaseError(
      'Invalid reference - related record not found',
      'FOREIGN_KEY_VIOLATION',
      error.message
    );
  }
  
  if (error.code === 'SQLITE_CONSTRAINT_CHECK') {
    return new DatabaseError(
      'Data validation failed',
      'CHECK_CONSTRAINT_VIOLATION',
      error.message
    );
  }
  
  if (error.code === 'SQLITE_CONSTRAINT') {
    return new DatabaseError(
      'Database constraint violation',
      'CONSTRAINT_VIOLATION',
      error.message
    );
  }
  
  return new DatabaseError(
    error.message || 'Database operation failed',
    'UNKNOWN_ERROR'
  );
}

/**
 * Execute database operation with error handling
 */
export function executeWithErrorHandling<T>(
  operation: () => T,
  errorContext?: string
): T {
  try {
    return operation();
  } catch (error) {
    const dbError = handleDatabaseError(error);
    if (errorContext) {
      dbError.message = `${errorContext}: ${dbError.message}`;
    }
    throw dbError;
  }
}

/**
 * Execute database transaction with error handling
 */
export function executeTransaction<T>(
  db: Database.Database,
  operations: (db: Database.Database) => T,
  errorContext?: string
): T {
  return executeWithErrorHandling(() => {
    const transaction = db.transaction(operations);
    return transaction(db);
  }, errorContext);
}

/**
 * Validate table exists in database
 */
export function validateTableExists(db: Database.Database, tableName: string): boolean {
  const query = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name=?
  `);
  
  const result = query.get(tableName);
  return result !== undefined;
}

/**
 * Initialize subscription system tables if they don't exist
 */
export function initializeSubscriptionTables(): void {
  const db = getDatabase();
  
  try {
    // Check if tables exist
    const subscriptionsExists = validateTableExists(db, 'subscriptions');
    const progressExists = validateTableExists(db, 'lesson_progress');
    
    if (!subscriptionsExists || !progressExists) {
      console.log('Subscription tables not found, creating...');
      
      // Import and run the migration script
      const { createSubscriptionTables } = require('../scripts/create-subscription-tables');
      createSubscriptionTables();
      
      console.log('Subscription tables initialized successfully');
    }
  } catch (error) {
    throw handleDatabaseError(error);
  } finally {
    db.close();
  }
}

/**
 * Get database connection with automatic table initialization
 */
export function getDatabaseWithInit(): Database.Database {
  // Initialize tables if needed (only runs once)
  initializeSubscriptionTables();
  
  return getDatabase();
}