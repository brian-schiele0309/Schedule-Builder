-- Enable UUID extension
extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  is_pro boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  canvas_url text,
  canvas_token_encrypted text,
  canvas_last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User scheduling preferences
create table public.preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null unique,
  work_start_time time default '09:00',
  work_end_time time default '22:00',
  max_session_minutes int default 90,
  break_minutes int default 15,
  preferred_days int[] default '{1,2,3,4,5}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Locked events (classes, work shifts — not auto-scheduled)
create table public.locked_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  title text not null,
  days_of_week int[] not null,
  start_time time not null,
  end_time time not null,
  recurs_weekly boolean default true,
  color text default '#6366f1',
  canvas_course_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Courses (from Canvas or manually added)
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  course_code text,
  color text default '#6366f1',
  canvas_course_id text,
  created_at timestamptz default now()
);

-- Tasks (assignments, study sessions — to be auto-scheduled)
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  course_id uuid references public.courses on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  estimated_minutes int not null default 60,
  priority int default 2,
  completed boolean default false,
  completed_at timestamptz,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  missed boolean default false,
  is_recurring boolean default false,
  recurrence_template_id uuid,
  canvas_assignment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recurrence templates
create table public.recurrence_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  title text not null,
  course_id uuid references public.courses on delete set null,
  estimated_minutes int not null default 60,
  priority int default 2,
  days_of_week int[],
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.locked_events enable row level security;
alter table public.courses enable row level security;
alter table public.tasks enable row level security;
alter table public.recurrence_templates enable row level security;

-- Policies: users can only access their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users manage own preferences" on public.preferences for all using (auth.uid() = user_id);
create policy "Users manage own locked events" on public.locked_events for all using (auth.uid() = user_id);
create policy "Users manage own courses" on public.courses for all using (auth.uid() = user_id);
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users manage own recurrence templates" on public.recurrence_templates for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  insert into public.preferences (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
