-- Seed Crownly Stories with sample editorial content
-- Run manually: psql or Supabase SQL editor after migration

DO $$
DECLARE
  v_author_id uuid;
  v_deal_room_id uuid;
  v_success_id uuid;
  v_collector_id uuid;
  v_story_id uuid;
BEGIN
  SELECT id INTO v_deal_room_id FROM public.story_categories WHERE slug = 'deal-room-stories';
  SELECT id INTO v_success_id FROM public.story_categories WHERE slug = 'success-stories';
  SELECT id INTO v_collector_id FROM public.story_categories WHERE slug = 'collector-spotlights';

  INSERT INTO public.authors (name, title, bio, avatar_url)
  VALUES (
    'Marcus Chen',
    'Crownly Editorial',
    'Covering deal-making and collector culture at the intersection of luxury and business.',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_author_id;

  IF v_author_id IS NULL THEN
    SELECT id INTO v_author_id FROM public.authors WHERE name = 'Marcus Chen' LIMIT 1;
  END IF;

  INSERT INTO public.stories (
    slug, title, subtitle, hero_image_url, body, category_id, author_id,
    read_time_minutes, status, published_at, is_featured, source_attribution
  ) VALUES (
    'watch-that-started-10-million-partnership',
    'The Watch That Started a $10 Million Partnership',
    'How a chance conversation between collectors turned into a successful business venture.',
    'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200',
    '[
      {"type": "paragraph", "text": "It started at a private dinner in Geneva, where two collectors—one in real estate, the other in private equity—bonded over a shared appreciation for independent watchmaking."},
      {"type": "pull_quote", "text": "The watch was the excuse. The trust was the asset.", "attribution": "James Whitfield"},
      {"type": "paragraph", "text": "Within six months, their casual conversations about market cycles evolved into a structured co-investment vehicle focused on hospitality assets across Europe."},
      {"type": "heading", "text": "The Lesson", "level": 2},
      {"type": "paragraph", "text": "Luxury communities aren''t just about objects—they''re about aligned values, discretion, and long-term thinking. The Patek Philippe on the table was the catalyst; the partnership was built on shared conviction."}
    ]'::jsonb,
    v_deal_room_id,
    v_author_id,
    6,
    'published',
    now() - interval '2 days',
    true,
    'Crownly Editorial — composite narrative for demonstration'
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_story_id;

  INSERT INTO public.stories (
    slug, title, subtitle, hero_image_url, body, category_id, author_id,
    read_time_minutes, status, published_at, is_featured, source_attribution
  ) VALUES (
    'from-first-rolex-to-eight-figure-portfolio',
    'From First Rolex to Eight-Figure Portfolio',
    'A collector''s journey from enthusiast to institutional investor.',
    'https://images.unsplash.com/photo-1548171915-e79a380ad444?w=1200',
    '[
      {"type": "paragraph", "text": "At 28, Elena Vasquez bought her first Rolex Submariner—not as an investment, but as a milestone. Fifteen years later, she manages an eight-figure alternative assets portfolio with watches as both passion and thesis."},
      {"type": "heading", "text": "Building Conviction", "level": 2},
      {"type": "paragraph", "text": "Her approach: buy what you love, document everything, and treat each acquisition as a lesson in market dynamics, brand equity, and global liquidity."}
    ]'::jsonb,
    v_success_id,
    v_author_id,
    5,
    'published',
    now() - interval '5 days',
    true,
    'Crownly Editorial — composite narrative for demonstration'
  )
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.stories (
    slug, title, subtitle, hero_image_url, body, category_id, author_id,
    read_time_minutes, status, published_at, is_featured
  ) VALUES (
    'collector-who-built-network-through-horology',
    'The Collector Who Built a Network Through Horology',
    'How showing up at watch events opened doors to venture capital and luxury retail partnerships.',
    'https://images.unsplash.com/photo-1614164185128-e4ec99c436d6?w=1200',
    '[
      {"type": "paragraph", "text": "David Okonkwo didn''t set out to network. He set out to learn. But showing up consistently at collector meetups, auctions, and brand events created a reputation for seriousness that attracted founders, dealers, and family offices alike."},
      {"type": "pull_quote", "text": "People remember who asks thoughtful questions—not who flaunts the latest reference."}
    ]'::jsonb,
    v_collector_id,
    v_author_id,
    4,
    'published',
    now() - interval '1 week',
    false
  )
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.celebrity_profiles (
    slug, name, bio, avatar_url, watch_collection, career_highlights,
    favorite_quote, source_urls, published
  ) VALUES (
    'example-industry-leader',
    'Example Industry Leader',
    'Publicly sourced profile placeholder for demonstration. Replace with verified, attributed content before production launch.',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
    '[{"brand": "Audemars Piguet", "model": "Royal Oak", "notes": "Often cited in public interviews"}]'::jsonb,
    '[{"title": "Built global retail network", "year": "2010s", "description": "From public press coverage"}]'::jsonb,
    'Time is the one asset you cannot manufacture.',
    ARRAY['https://example.com/public-source'],
    true
  )
  ON CONFLICT (slug) DO NOTHING;

  IF v_story_id IS NOT NULL THEN
    INSERT INTO public.featured_stories (story_id, placement, sort_order)
    SELECT v_story_id, 'home', 0
    WHERE NOT EXISTS (
      SELECT 1 FROM public.featured_stories WHERE story_id = v_story_id AND placement = 'home'
    );
  END IF;
END $$;
