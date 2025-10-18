-- Add username, phone, and date_of_birth fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
