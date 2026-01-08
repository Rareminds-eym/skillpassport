-- Complete Library Management System Setup (College-Specific)
-- Run this script in your Supabase SQL Editor to set up the entire library system

-- ============================================================================
-- LIBRARY MANAGEMENT SYSTEM SETUP
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LIBRARY BOOKS TABLE
-- ========