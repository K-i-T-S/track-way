create table booking_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company_name text,
  phone text not null,
  email text not null,
  customer_type text not null check (customer_type in (
    'Truck and Transportation Fleet',
    'Car-Rental Company',
    'Delivery Company',
    'Private Vehicle Owner',
    'School Transportation',
    'Construction Fleet',
    'Corporate Vehicles',
    'Taxi Fleet',
    'Heavy Equipment',
    'Emergency or Service Vehicles',
    'Other'
  )),
  num_vehicles integer not null check (num_vehicles > 0),
  vehicle_type text not null check (vehicle_type in (
    'Cars', 'Trucks', 'Vans', 'Buses', 'Motorcycles',
    'Heavy Equipment', 'Mixed Fleet', 'Other'
  )),
  preferred_area text not null,
  preferred_date date not null,
  message text,
  submission_channel text not null check (submission_channel in ('whatsapp', 'email')),
  status text not null default 'New Request' check (status in (
    'New Request', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'
  )),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table booking_requests enable row level security;

create table contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table contact_inquiries enable row level security;
