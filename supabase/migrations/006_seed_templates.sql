insert into public.templates (name, slug, occasion, tier, price_paise, thumbnail_url, has_animation, has_music, component_name)
values
('Birthday Classic', 'birthday-classic', 'birthday', 'free', 0, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80', true, false, 'birthday-classic'),
('Birthday Glow', 'birthday-glow', 'birthday', 'standard', 9900, 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80', true, true, 'birthday-glow'),
('Wedding Elegant', 'wedding-elegant', 'wedding', 'premium', 19900, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80', true, true, 'wedding-elegant'),
('Anniversary Romantic', 'anniversary-romantic', 'anniversary', 'standard', 12900, 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80', true, true, 'anniversary-romantic'),
('Festival Diwali', 'festival-diwali', 'festival', 'premium', 17900, 'https://images.unsplash.com/photo-1605292356183-a77d0a9c9d1d?auto=format&fit=crop&w=900&q=80', true, true, 'festival-diwali'),
('Graduation Celebration', 'graduation-celebration', 'graduation', 'free', 0, 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80', true, false, 'graduation-celebration')
on conflict (slug) do update set
  name = excluded.name,
  occasion = excluded.occasion,
  tier = excluded.tier,
  price_paise = excluded.price_paise,
  thumbnail_url = excluded.thumbnail_url,
  has_animation = excluded.has_animation,
  has_music = excluded.has_music,
  component_name = excluded.component_name,
  is_active = true;
