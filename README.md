# DomaDrip 💧

**Level up your wallet.** Farm XP, unlock achievements, and climb the leaderboard just by holding tokens on the Doma Network. Your daily drip of rewards starts now.

![DomaDrip Banner](public/globe.svg)

## 🚀 Features

- **Passive XP Farming**: Automatically calculates XP based on your token holdings (1$ = 10 XP/day).
- **Real-time Leaderboard**: Compete with other farmers on the Doma Network.
- **Achievement System**: Unlock badges for being a "Whale", holding diverse assets, or maintaining streaks.
- **Daily Streak**: Claim daily bonuses to boost your level.
- **Living UI**: Interactive background and glassmorphism design.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Framer Motion
- **Web3**: Wagmi + Viem + TanStack Query
- **Database**: Supabase (PostgreSQL)
- **Chain**: Doma Mainnet (ID: 97477)

## 📦 Setup & Deployment

1. **Clone & Install**
   ```bash
   git clone https://github.com/ogeth777/DomaDrip.git
   cd DomaDrip
   npm install
   ```

2. **Environment Variables**
   Create `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Database Setup (Supabase)**
   Run this SQL in your Supabase SQL Editor to initialize the tables:

   ```sql
   -- 1. Create Users Table
   create table public.users (
     id uuid not null default gen_random_uuid (),
     wallet text not null unique,
     nickname text,
     created_at timestamp with time zone not null default now(),
     constraint users_pkey primary key (id)
   );

   -- 2. Create Activations Table
   create table public.activations (
     id uuid not null default gen_random_uuid (),
     wallet text not null,
     token_symbol text not null,
     balance_at_activation double precision not null,
     price_at_activation double precision not null,
     activated_at timestamp with time zone not null default now(),
     last_claimed_at timestamp with time zone null,
     current_xp double precision not null default 0,
     constraint activations_pkey primary key (id)
   );

   -- 3. Enable Security Policies (RLS)
   alter table public.users enable row level security;
   alter table public.activations enable row level security;

   create policy "Enable read access for all users" on public.users for select using (true);
   create policy "Enable insert access for all users" on public.users for insert with check (true);
   create policy "Enable update access for all users" on public.users for update using (true);

   create policy "Enable read access for all users" on public.activations for select using (true);
   create policy "Enable insert access for all users" on public.activations for insert with check (true);
   create policy "Enable update access for all users" on public.activations for update using (true);
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Built for the Doma Network Grant Program.
