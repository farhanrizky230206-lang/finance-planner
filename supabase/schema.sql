-- Jalankan seluruh file ini di Supabase SQL Editor (project BARU direkomendasikan).
-- Seluruh data keuangan dan profil hanya bisa dibaca/diubah pemiliknya (RLS).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  whatsapp_number text,
  gender text,
  birth_date date,
  whatsapp_opt_in boolean not null default false,
  whatsapp_verified_at timestamptz,
  wa_challenge_hash text,
  wa_challenge_expires timestamptz,
  updated_at timestamptz not null default now(),
  constraint arus_name_check check (full_name is null or char_length(full_name) <= 80),
  constraint arus_gender_check check (gender is null or gender in ('Laki-laki','Perempuan','Lainnya','Tidak menyebutkan')),
  constraint arus_whatsapp_check check (whatsapp_number is null or whatsapp_number ~ '^62[1-9][0-9]{7,12}$'),
  constraint arus_birth_check check (birth_date is null or (birth_date >= date '1900-01-01' and birth_date <= current_date))
);

create table if not exists public.finance_books (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content jsonb not null default '{"version":1,"months":{},"transactions":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint arus_book_shape_check check (
    jsonb_typeof(content) = 'object'
    and jsonb_typeof(content->'months') = 'object'
    and jsonb_typeof(content->'transactions') = 'array'
  )
);

-- Log privat agar tidak mengirim pesan berulang saat setiap transaksi diinput.
create table if not exists public.notification_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null check (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  kind text not null check (kind in ('warning_80','over_100')),
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  api_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  unique(user_id, month_key, kind)
);

alter table public.profiles enable row level security;
alter table public.finance_books enable row level security;
alter table public.notification_logs enable row level security;

revoke all on table public.profiles, public.finance_books, public.notification_logs from anon, authenticated;
grant select on table public.profiles to authenticated;
-- Blok pengguna mengubah status verifikasi dan OTP via REST. Hanya Edge Function (service_role) boleh mengubahnya.
grant insert (id,full_name,whatsapp_number,gender,birth_date,whatsapp_opt_in) on table public.profiles to authenticated;
grant update (full_name,whatsapp_number,gender,birth_date,whatsapp_opt_in) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.finance_books to authenticated;
-- notification_logs sengaja tidak di-GRANT ke authenticated / anon; hanya server service_role.

create policy "profiles_select_self" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_self" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "finance_select_self" on public.finance_books for select to authenticated using ((select auth.uid()) = user_id);
create policy "finance_insert_self" on public.finance_books for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "finance_update_self" on public.finance_books for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "finance_delete_self" on public.finance_books for delete to authenticated using ((select auth.uid()) = user_id);

-- Bila nomor WhatsApp diganti, verifikasi lama tidak berlaku lagi.
create or replace function public.arus_phone_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.whatsapp_number is distinct from old.whatsapp_number then
    new.whatsapp_verified_at := null;
    new.wa_challenge_hash := null;
    new.wa_challenge_expires := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists on_phone_change_arus on public.profiles;
create trigger on_phone_change_arus before update on public.profiles
for each row execute procedure public.arus_phone_change();

-- Profile otomatis dibuat untuk akun email dan OAuth Google.
create or replace function public.arus_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare m jsonb;
        wa text;
        gg text;
        bd date;
begin
  m := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wa := m->>'whatsapp_number';
  if wa is not null and wa !~ '^62[1-9][0-9]{7,12}$' then wa := null; end if;
  gg := m->>'gender';
  if gg not in ('Laki-laki','Perempuan','Lainnya','Tidak menyebutkan') then gg := null; end if;
  begin
    bd := nullif(m->>'birth_date','')::date;
    if bd > current_date or bd < date '1900-01-01' then bd := null; end if;
  exception when others then bd := null;
  end;
  insert into public.profiles(id, full_name, whatsapp_number, gender, birth_date, whatsapp_opt_in)
  values (
    new.id,
    nullif(left(coalesce(m->>'full_name', m->>'name', ''),80),''),
    wa, gg, bd,
    (m->>'whatsapp_opt_in')='true' and wa is not null
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_arus on auth.users;
create trigger on_auth_user_created_arus after insert on auth.users
for each row execute procedure public.arus_new_user();

-- Aman dijalankan kembali hanya pada database baru. Jika kebijakan di atas sudah dibuat,
-- menjalankan ulang SQL create policy akan menghasilkan 'already exists'; jangan ulangi tanpa penyesuaian.
