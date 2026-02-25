-- Add priority column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN priority text DEFAULT 'Medium' 
CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'));