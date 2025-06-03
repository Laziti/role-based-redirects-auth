-- Enable the moddatetime extension
create extension if not exists moddatetime schema extensions;

-- Create subscription request status enum
create type subscription_request_status as enum ('pending', 'approved', 'rejected');

-- Create subscription_requests table
create table public.subscription_requests (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    plan_id text not null,
    receipt_path text not null,
    status subscription_request_status not null default 'pending',
    amount numeric not null,
    duration text not null,
    listings_per_month integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.subscription_requests enable row level security;

-- Users can view their own subscription requests
create policy "Users can view their own subscription requests"
on public.subscription_requests for select
to authenticated
using (auth.uid() = user_id);

-- Users can insert their own subscription requests
create policy "Users can insert their own subscription requests"
on public.subscription_requests for insert
to authenticated
with check (auth.uid() = user_id);

-- Create storage bucket for receipts
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true);

-- Add storage policies for receipts bucket
create policy "Users can upload their own receipts"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'receipts' 
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own receipts"
on storage.objects for select
to authenticated
using (
    bucket_id = 'receipts' 
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or exists (
            select 1 from auth.users
            where auth.users.id = auth.uid()
            and raw_user_meta_data->>'role' = 'super_admin'
        )
    )
);

-- Add RLS policy for admins to view all subscription requests
create policy "Admins can view all subscription requests"
on public.subscription_requests for select
to authenticated
using (
    exists (
        select 1 from auth.users
        where auth.users.id = auth.uid()
        and raw_user_meta_data->>'role' = 'super_admin'
    )
);

-- Add trigger for updated_at
create trigger handle_updated_at before update on public.subscription_requests
  for each row execute procedure moddatetime(updated_at); 