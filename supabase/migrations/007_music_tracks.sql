create table public.music_tracks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  mood text,
  occasion occasion_type,
  url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.music_tracks enable row level security;

create policy "Music tracks are publicly readable"
  on public.music_tracks for select using (is_active = true);

insert into public.music_tracks (title, mood, occasion, url)
values
('Gentle Piano', 'calm', 'anniversary', 'https://example.com/music/gentle-piano.mp3'),
('Warm Celebration', 'happy', 'birthday', 'https://example.com/music/warm-celebration.mp3'),
('Soft Romance', 'romantic', 'wedding', 'https://example.com/music/soft-romance.mp3'),
('Festival Lights', 'festive', 'festival', 'https://example.com/music/festival-lights.mp3'),
('Bright Future', 'uplifting', 'graduation', 'https://example.com/music/bright-future.mp3')
on conflict do nothing;
