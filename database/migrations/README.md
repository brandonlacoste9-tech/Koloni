# Database Migrations

This directory contains database migration scripts for the Kolony platform.

## Migration Files

### 001_video_generation_tables.sql
Creates all video generation related tables:
- `video_generation_jobs`
- `scene_plans`
- `workflow_templates`
- `voice_library`
- `editing_operations`
- `asset_library`
- `video_generation_history`
- `video_performance_metrics`
- `brand_guidelines`

### 002_rls_policies.sql
Enables Row Level Security (RLS) and creates policies for all video generation tables.

## Running Migrations

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order

### Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Manual Execution
```bash
# Connect to your database and run:
psql -h your-db-host -U postgres -d postgres -f 001_video_generation_tables.sql
psql -h your-db-host -U postgres -d postgres -f 002_rls_policies.sql
```

## Migration Order

Always run migrations in numerical order:
1. `001_video_generation_tables.sql` (creates tables)
2. `002_rls_policies.sql` (adds security policies)

## Verifying Migrations

After running migrations, verify tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'video%' OR table_name LIKE 'scene%' OR table_name LIKE 'workflow%';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('video_generation_jobs', 'scene_plans', 'workflow_templates');
```

## Rollback

To rollback a migration, you can drop the tables (use with caution):

```sql
-- Drop tables in reverse order (due to foreign keys)
DROP TABLE IF EXISTS video_performance_metrics CASCADE;
DROP TABLE IF EXISTS brand_guidelines CASCADE;
DROP TABLE IF EXISTS video_generation_history CASCADE;
DROP TABLE IF EXISTS asset_library CASCADE;
DROP TABLE IF EXISTS editing_operations CASCADE;
DROP TABLE IF EXISTS voice_library CASCADE;
DROP TABLE IF EXISTS workflow_templates CASCADE;
DROP TABLE IF EXISTS scene_plans CASCADE;
DROP TABLE IF EXISTS video_generation_jobs CASCADE;
```

---

**Note**: Always backup your database before running migrations in production.

