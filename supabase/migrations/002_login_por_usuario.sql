-- Login por nome de usuário. O e-mail vira apenas contato (opcional). Nada é apagado.
alter table public.accounts add column username text;
alter table public.accounts add constraint accounts_username_format check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$');
create unique index accounts_username_key on public.accounts (username);
alter table public.accounts alter column email drop not null;
alter table public.accounts drop constraint accounts_email_key;
alter table public.accounts drop constraint accounts_email_check;
alter table public.accounts add constraint accounts_email_check check (email is null or char_length(email) between 3 and 254);
