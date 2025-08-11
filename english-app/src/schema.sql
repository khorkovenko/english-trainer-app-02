create table words (
                       id uuid primary key default uuid_generate_v4(),
                       user_id uuid references auth.users(id) on delete cascade,
                       word text not null,
                       explanation text,
                       association text,
                       created_at timestamp with time zone default now(),
                       updated_at timestamp with time zone default now()
);

create table grammar (
                         id uuid primary key default uuid_generate_v4(),
                         user_id uuid references auth.users(id) on delete cascade,
                         rule_name varchar(255) not null,
                         html_explanation text not null,
                         created_at timestamp with time zone default timezone('utc', now()),
                         updated_at timestamp with time zone default timezone('utc', now())
);

create table reading (
                         id uuid primary key default uuid_generate_v4(),
                         user_id uuid references auth.users(id) on delete cascade,
                         theme text not null,
                         prompt text not null,
                         created_at timestamp with time zone default now(),
                         updated_at timestamp with time zone default now()
);

create table reading_prompts (
                                 id uuid primary key default uuid_generate_v4(),
                                 reading_id uuid references reading(id) on delete cascade,
                                 prompt text not null,
                                 created_at timestamp with time zone default now(),
                                 updated_at timestamp with time zone default now()
);
