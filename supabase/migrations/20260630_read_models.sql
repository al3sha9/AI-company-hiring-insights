create table if not exists company_summaries (
  scraped_at timestamptz not null,
  slug text not null,
  name text not null,
  current_roles integer not null default 0,
  previous_roles integer not null default 0,
  change integer not null default 0,
  change_pct numeric not null default 0,
  top_hiring_location text not null default 'N/A',
  primary key (scraped_at, slug)
);

create index if not exists company_summaries_slug_idx
  on company_summaries (slug, scraped_at desc);

create table if not exists company_signals (
  scraped_at timestamptz not null,
  slug text not null,
  name text not null,
  label text,
  count integer not null default 0,
  description text,
  evidence jsonb not null default '[]'::jsonb,
  top_category text,
  primary key (scraped_at, slug)
);

create index if not exists company_signals_slug_idx
  on company_signals (slug, scraped_at desc);

create table if not exists category_matrix_snapshots (
  scraped_at timestamptz not null,
  company_slug text not null,
  company_name text not null,
  category text not null,
  count integer not null default 0,
  primary key (scraped_at, company_slug, category)
);

create index if not exists category_matrix_snapshots_scraped_at_idx
  on category_matrix_snapshots (scraped_at desc);

create table if not exists location_summaries (
  scraped_at timestamptz not null,
  country text not null,
  roles integer not null default 0,
  top_company text not null default 'N/A',
  primary key (scraped_at, country)
);

create index if not exists location_summaries_scraped_at_idx
  on location_summaries (scraped_at desc);
