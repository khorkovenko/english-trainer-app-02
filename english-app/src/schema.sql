create table words (
                       id uuid primary key default uuid_generate_v4(),
                       user_id uuid references auth.users(id) on delete cascade,
                       word text not null,
                       explanation text,
                       association text,
                       created_at timestamp with time zone default now(),
                       updated_at timestamp with time zone default now()
);
