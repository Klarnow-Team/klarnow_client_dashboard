# How to Setup Onboarding Database

This guide explains how to set up the database tables for storing onboarding data from Launch Kit and Growth Kit.

## Overview

The onboarding system uses two main tables:
- **`projects`**: Stores project information (email, kit_type, onboarding status)
- **`onboarding_steps`**: Stores all 3 onboarding steps with their form data

## Database Schema

### Tables Created

#### 1. `projects` Table
- Stores one project per email per kit type
- Tracks onboarding completion status and percentage
- Uses email as the primary identifier (no user_id required)

#### 2. `onboarding_steps` Table
- Stores all 3 onboarding steps per project
- Form data is stored as JSONB in the `fields` column
- Each step includes status, completion tracking, and timestamps

## Setup Instructions

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your Klarnow project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New query"** button

### Step 2: Run the Migration

1. Open the migration file: `supabase/migrations/create_onboarding_tables.sql`
2. Copy **ALL** the contents (Cmd+A, Cmd+C)
3. Paste into the Supabase SQL Editor (Cmd+V)
4. Click the **"Run"** button (or press Cmd+Enter)

### Step 3: Verify Tables Were Created

After running the migration, verify the tables exist:

1. In Supabase Dashboard, go to **Table Editor**
2. You should see:
   - `projects` table
   - `onboarding_steps` table

3. Check the table structure:
   - `projects` should have columns: `id`, `email`, `kit_type`, `onboarding_percent`, `onboarding_finished`, `created_at`, `updated_at`
   - `onboarding_steps` should have columns: `id`, `project_id`, `step_number`, `title`, `status`, `fields` (JSONB), etc.

## How It Works

### Data Flow

1. **User completes onboarding** (Step 1 → Step 2 → Step 3)
2. **Data saved to localStorage** immediately (for offline access)
3. **When Step 3 is completed**, the app calls `/api/onboarding/complete`
4. **API endpoint saves**:
   - Creates/updates project record
   - Saves all 3 steps to `onboarding_steps` table
   - Updates project status (`onboarding_finished = true`)

### Data Structure

#### Project Record
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "kit_type": "LAUNCH" | "GROWTH",
  "onboarding_percent": 100,
  "onboarding_finished": true
}
```

#### Onboarding Step Record
```json
{
  "id": "uuid",
  "project_id": "project-uuid",
  "step_number": 1 | 2 | 3,
  "title": "Step title",
  "status": "DONE",
  "required_fields_total": 7,
  "required_fields_completed": 7,
  "fields": {
    // All form field data stored here
    "business_name": "...",
    "contact_email": "...",
    // etc.
  }
}
```

## Troubleshooting

### Error: "relation does not exist"
**Meaning**: Tables haven't been created yet.

**Solution**: Run the migration SQL file in Supabase SQL Editor.

### Error: "column does not exist"
**Meaning**: Table exists but is missing columns.

**Solution**: The migration should create all columns. If you see this error, try dropping the tables and running the migration again (see below).

### Error: "duplicate key value violates unique constraint"
**Meaning**: A project already exists for this email + kit_type combination.

**Solution**: This is expected behavior. The endpoint will update the existing project instead of creating a new one.

### Tables Already Exist

If the tables already exist from a previous setup:

1. You can drop them first (if you want a fresh start):
   ```sql
   DROP TABLE IF EXISTS onboarding_steps CASCADE;
   DROP TABLE IF EXISTS projects CASCADE;
   ```
2. Then run the migration file again.

**Warning**: Dropping tables will delete all existing data!

## Testing

After setup, test the onboarding flow:

1. Complete all 3 onboarding steps
2. Check the browser console for: "Onboarding saved to database successfully!"
3. Verify in Supabase Dashboard:
   - Go to **Table Editor** → `projects`
   - Find your email and kit_type
   - Check that `onboarding_finished = true`
   - Go to **Table Editor** → `onboarding_steps`
   - Verify all 3 steps exist with `status = 'DONE'`

## API Endpoint

### POST `/api/onboarding/complete`

Saves all 3 onboarding steps when Step 3 is completed.

**Request Body**:
```json
{
  "email": "user@example.com",
  "kit_type": "LAUNCH",
  "steps": [
    {
      "step_number": 1,
      "title": "Tell us who you are",
      "status": "DONE",
      "required_fields_total": 7,
      "required_fields_completed": 7,
      "time_estimate": "About 5 minutes",
      "fields": { /* all form data */ },
      "started_at": "2024-01-01T00:00:00Z",
      "completed_at": "2024-01-01T00:05:00Z"
    },
    // ... steps 2 and 3
  ]
}
```

**Response** (Success):
```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "email": "user@example.com",
    "kit_type": "LAUNCH",
    "onboarding_percent": 100,
    "onboarding_finished": true
  },
  "steps": [ /* array of saved step records */ ]
}
```

## Next Steps

After setting up the database:
1. Users can complete onboarding
2. Data is saved to localStorage immediately
3. When Step 3 completes, data is automatically saved to Supabase
4. You can query the data in Supabase Dashboard or via API

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check the server logs for API endpoint errors
3. Verify the tables exist in Supabase Dashboard
4. Ensure environment variables are set correctly

