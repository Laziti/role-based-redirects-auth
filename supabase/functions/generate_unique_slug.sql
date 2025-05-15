
CREATE OR REPLACE FUNCTION public.generate_unique_slug(
  first_name TEXT,
  last_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  existing_count INTEGER;
BEGIN
  -- Create base slug from name
  base_slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        CONCAT(first_name, '-', last_name),
        '[^a-zA-Z0-9\-]', '', 'g'
      ),
      '\-{2,}', '-', 'g'
    )
  );
  
  -- Initially try with the base slug
  final_slug := base_slug;
  
  -- Check if slug already exists
  LOOP
    SELECT COUNT(*)
    INTO existing_count
    FROM profiles
    WHERE slug = final_slug;
    
    IF existing_count = 0 THEN
      -- No conflict, we can use this slug
      RETURN final_slug;
    END IF;
    
    -- Increment counter and try again
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
  END LOOP;
END;
$function$;
