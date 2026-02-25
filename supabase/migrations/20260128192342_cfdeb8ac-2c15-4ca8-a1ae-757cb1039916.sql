-- Add ring_color column to bujji_status for dynamic avatar ring color
ALTER TABLE public.bujji_status ADD COLUMN ring_color text DEFAULT '#ef4444';