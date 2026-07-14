INSERT INTO public.settings (key, value_json)
VALUES ('restaurant_contact',
        '{"email":"info@kiscsibeetterem.hu"}'::jsonb)
ON CONFLICT (key) DO NOTHING;