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

create table listening (
                           id uuid primary key default uuid_generate_v4(),
                           user_id uuid references auth.users(id) on delete cascade,
                           theme text not null,
                           created_at timestamp with time zone default now(),
                           updated_at timestamp with time zone default now()
);

create table listening_prompts (
                                   id uuid primary key default uuid_generate_v4(),
                                   listening_id uuid references listening(id) on delete cascade,
                                   prompt text not null,
                                   created_at timestamp with time zone default now(),
                                   updated_at timestamp with time zone default now()
);

create table speaking (
                          id uuid primary key default uuid_generate_v4(),
                          user_id uuid references auth.users(id) on delete cascade,
                          topic text not null,
                          created_at timestamp with time zone default now(),
                          updated_at timestamp with time zone default now()
);

create table speaking_prompts (
                                  id uuid primary key default uuid_generate_v4(),
                                  speaking_id uuid references speaking(id) on delete cascade,
                                  prompt text not null,
                                  created_at timestamp with time zone default now(),
                                  updated_at timestamp with time zone default now()
);

create table writing_prompts (
                                 id uuid primary key default uuid_generate_v4(),
                                 user_id uuid references auth.users(id) on delete cascade,
                                 prompt text not null,
                                 created_at timestamp with time zone default now(),
                                 updated_at timestamp with time zone default now()
);

create table mistakes (
                          id uuid primary key default uuid_generate_v4(),
                          user_id uuid not null references auth.users(id) on delete cascade,
                          vocabulary text[] default '{}',
                          grammar text[] default '{}',
                          reading text[] default '{}',
                          listening text[] default '{}',
                          speaking text[] default '{}',
                          writing text[] default '{}',
                          created_at timestamp with time zone default timezone('utc'::text, now()),
                          updated_at timestamp with time zone default timezone('utc'::text, now())
);

create unique index unique_user_mistakes on mistakes(user_id);
