-- Add WhatsApp column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
