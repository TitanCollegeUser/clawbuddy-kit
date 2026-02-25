-- Remove the foreign key constraint on users.id to allow system users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Insert Bujji as a system user
INSERT INTO public.users (id, name, email)
VALUES (gen_random_uuid(), 'Bujji', 'bujji@system.local')
ON CONFLICT (email) DO NOTHING;