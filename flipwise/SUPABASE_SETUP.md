# Supabase Setup for FlipWise

Follow these steps to set up Supabase for the FlipWise application:

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project
3. Choose a name for your project (e.g., "flipwise")
4. Set a secure database password
5. Choose a region close to your users
6. Click "Create new project"

## 2. Set Up Database Tables

1. Once your project is created, go to the SQL Editor in the Supabase dashboard
2. Create a new query
3. Copy and paste the SQL from the `supabase-setup.sql` file
4. Run the query to create all necessary tables and security policies

## 3. Configure Authentication

1. Go to Authentication > Settings in the Supabase dashboard
2. Under "Email Auth", make sure "Enable Email Signup" is turned on
3. Optionally, configure other authentication providers as needed

## 4. Set Up Environment Variables

1. In the Supabase dashboard, go to Settings > API
2. Copy the "Project URL" and "anon/public" key
3. Create a `.env.local` file in the root of your project with the following content:

