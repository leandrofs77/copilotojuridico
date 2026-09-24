INSERT INTO public.user_roles (user_id, role)
VALUES ('f6f327b9-c6c4-47b9-aa92-c76f06b60992', 'superadmin')
ON CONFLICT (user_id, role) DO NOTHING;