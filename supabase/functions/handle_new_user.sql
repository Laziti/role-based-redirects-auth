
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert a row into public.profiles with default status and other fields
  INSERT INTO public.profiles (
    id, 
    status, 
    first_name, 
    last_name,
    listing_limit
  )
  VALUES (
    NEW.id, 
    'pending_approval',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    '{"type": "month", "value": 5}'::jsonb
  );
  
  -- By default, assign 'agent' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agent');

  RETURN NEW;
END;
$function$;
