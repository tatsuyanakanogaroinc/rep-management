# Database Setup Instructions

## Settings Tables Setup

To enable the new settings management functionality, please run the following SQL in your Supabase SQL Editor:

### 1. Navigate to Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### 2. Run the SQL Script
Copy and paste the entire contents of `supabase/migrations/create_settings_tables.sql` into the SQL editor and click "RUN".

The script will create the following tables:
- `service_settings` - Basic service configuration
- `growth_parameters` - Growth and acquisition parameters
- `channel_targets` - Marketing channel targets and CPA settings
- `service_plans` - Service pricing plans
- `cohort_analysis` - Customer cohort tracking
- `unit_economics` - Unit economics calculations

### 3. Verify Setup
After running the script, verify that the tables were created successfully by:
1. Going to "Table Editor" in Supabase
2. Checking that all the new tables appear in the list
3. Verifying that the default data was inserted into `service_settings` and `service_plans`

### 4. Access Settings Page
Once the database is set up, you can access the new settings management page at:
- Dashboard → システム設定 (System Settings)
- Or directly at `/settings`

## Default Settings Included

The script includes default settings for:
- Monthly plan: ¥4,980
- Yearly plan: ¥49,800  
- Invitation slots per user: 5
- Invitation send rate: 80%
- Invitation acceptance rate: 30%
- Trial conversion rate: 15%
- Monthly churn rate: 5%
- Yearly churn rate: 20%

These can be modified through the settings interface once deployed.