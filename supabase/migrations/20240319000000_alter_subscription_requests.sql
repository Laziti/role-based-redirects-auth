-- Drop existing foreign key constraints if they exist
alter table public.subscription_requests
drop constraint if exists subscription_requests_user_id_fkey,
drop constraint if exists subscription_requests_profile_id_fkey;

-- Drop redundant profile_id column
alter table public.subscription_requests
drop column if exists profile_id;

-- Add foreign key constraints
alter table public.subscription_requests
add constraint subscription_requests_user_id_fkey 
foreign key (user_id) references auth.users(id) on delete cascade;

-- Drop existing policies
drop policy if exists "Users can view their own subscription requests" on public.subscription_requests;
drop policy if exists "Users can insert their own subscription requests" on public.subscription_requests;
drop policy if exists "Admins can view all subscription requests" on public.subscription_requests;
drop policy if exists "Admins can manage all subscription requests" on public.subscription_requests;
drop policy if exists "Admin Access" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- Enable RLS on tables
alter table public.subscription_requests enable row level security;
alter table public.profiles enable row level security;

-- Add RLS policies for subscription_requests
create policy "Users can view their own subscription requests"
on public.subscription_requests for select
to authenticated
using (
    auth.uid() = user_id 
    or exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
);

create policy "Users can insert their own subscription requests"
on public.subscription_requests for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Admins can manage all subscription requests"
on public.subscription_requests 
for all
to authenticated
using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
);

-- Add RLS policies for profiles table
create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using (
    id = auth.uid() 
    or exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (
    id = auth.uid() 
    or exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'super_admin'
    )
);

-- Storage policies for receipts bucket
begin;
  -- Drop existing storage policies if they exist
  drop policy if exists "Users can upload their own receipts" on storage.objects;
  drop policy if exists "Users can view their own receipts" on storage.objects;
  drop policy if exists "Users can view receipts" on storage.objects;

  -- Create new storage policies
  create policy "Users can upload receipts"
  on storage.objects for insert
  to authenticated
  with check (
      bucket_id = 'receipts' 
      and (storage.foldername(name))[1] = auth.uid()::text
  );

  create policy "Users can access receipts"
  on storage.objects for select
  to authenticated
  using (
      bucket_id = 'receipts' 
      and (
          (storage.foldername(name))[1] = auth.uid()::text
          or exists (
            select 1 from user_roles
            where user_roles.user_id = auth.uid()
            and user_roles.role = 'super_admin'
          )
      )
  );
commit;

-- Add subscription_details and update listing_limit in profiles table
alter table public.profiles
add column if not exists subscription_status text default 'free' check (subscription_status in ('free', 'pro')),
add column if not exists subscription_details jsonb default null,
alter column listing_limit set data type jsonb using listing_limit::jsonb;

comment on column public.profiles.subscription_status is 'User subscription status (free or pro)';
comment on column public.profiles.subscription_details is 'Details about the user subscription including plan, duration, limits, etc';
comment on column public.profiles.listing_limit is 'Monthly listing limit configuration including type, value, and reset date'; 