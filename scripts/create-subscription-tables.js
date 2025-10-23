#!/usr/bin/env node

/**
 * Database migration script for course subscription system
 * Creates subscriptions and lesson_progress tables with proper constraints
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database file path (same as used in auth.ts)
const DB_PATH = path.join(process.cwd(), 'database.sqlite');

function createSubscriptionTables() {
  const db = new Database(DB_PATH);
  
  try {
    console.log('Creating subscription system tables...');
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Create subscriptions table
    const createSubscriptionsTable = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
        UNIQUE(user_id, course_id),
        FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
      )
    `;
    
    // Create lesson_progress table
    const createLessonProgressTable = `
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        completed_at DATETIME NULL,
        progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course_id, lesson_id),
        FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
      )
    `;
    
    // Execute table creation
    db.exec(createSubscriptionsTable);
    console.log('✓ Created subscriptions table');
    
    db.exec(createLessonProgressTable);
    console.log('✓ Created lesson_progress table');
    
    // Create indexes for better query performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_course_id ON subscriptions(course_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_course ON subscriptions(user_id, course_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id ON lesson_progress(course_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON lesson_progress(user_id, course_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
    `;
    
    db.exec(createIndexes);
    console.log('✓ Created database indexes');
    
    console.log('Database migration completed successfully!');
    
  } catch (error) {
    console.error('Error creating subscription tables:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  createSubscriptionTables();
}

module.exports = { createSubscriptionTables };