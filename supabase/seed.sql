-- WeddingMall — seed data (public, approved/published). Safe to run after
-- 0001_core_schema.sql + 0002_rls_policies.sql. Idempotent via fixed UUIDs.
-- Money is integer minor units (paise). Coordinates around Patna for distance.

-- Vendors -------------------------------------------------------------------
insert into vendors (id, name, category, city, approval, verified, rating, review_count) values
  ('11111111-0000-0000-0000-000000000001', 'Usha Resort',           'venue',       'Patna', 'approved', true, 5.0, 128),
  ('11111111-0000-0000-0000-000000000002', 'Reeti Rivaaj Banquet',  'venue',       'Patna', 'approved', true, 4.9,  94),
  ('11111111-0000-0000-0000-000000000003', 'Makeovers by Rhea',     'makeup',      'Patna', 'approved', true, 4.9, 212),
  ('11111111-0000-0000-0000-000000000004', 'Frames & Feels',        'photography', 'Patna', 'approved', true, 4.8,  76),
  ('11111111-0000-0000-0000-000000000005', 'Annapurna Caterers',    'catering',    'Patna', 'approved', false,4.7, 143),
  ('11111111-0000-0000-0000-000000000006', 'Gulmohar Decor',        'decor',       'Patna', 'approved', true, 4.8,  58),
  ('11111111-0000-0000-0000-000000000007', 'Henna Stories',         'mehendi',     'Patna', 'approved', true, 4.9, 101)
on conflict (id) do nothing;

-- Listings ------------------------------------------------------------------
insert into listings (id, vendor_id, category, title, description, city, lat, lng, price_mode, from_price_minor, price_unit, capacity_min, capacity_max, amenities, status) values
  ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','venue','Usha Resort — Lawn & Banquet','A premier lawn-and-banquet venue in Patna with landscaped gardens, a 1,200-guest capacity and in-house catering.','Patna',25.6100,85.1200,'fixed',45000000,'per event',200,1200,'{"Parking 200+","In-house catering","AC banquet","Bridal room","DJ allowed"}','published'),
  ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000002','venue','Reeti Rivaaj Banquet','A refined indoor banquet with chandelier lighting and customisable stage decor, seating up to 800 guests.','Patna',25.6300,85.1500,'fixed',52500000,'per event',150,800,'{"Valet parking","AC hall","Catering","Stage decor","Rooms"}','published'),
  ('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000003','makeup','Makeovers by Rhea — Bridal Makeup','Signature HD and airbrush bridal makeup with a complimentary trial. Rhea travels to your venue.','Patna',25.5900,85.1300,'fixed',2800000,'per booking',null,null,'{"HD & airbrush","Trial available","Travels to venue","Draping included"}','published'),
  ('22222222-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000004','photography','Frames & Feels — Candid Photography','Candid-first photography with cinematic wedding films, same-day teasers and drone coverage.','Patna',25.6000,85.1600,'fixed',8500000,'per day',null,null,'{"Candid + traditional","Cinematic film","Same-day teaser","Drone"}','published'),
  ('22222222-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000005','catering','Annapurna Caterers — Multi-cuisine','Multi-cuisine wedding catering with live counters and customisable menus.','Patna',25.6200,85.1000,'fixed',85000,'per plate',null,null,'{"Veg & non-veg","Live counters","Custom menu","Serving staff"}','published'),
  ('22222222-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000006','decor','Gulmohar Decor — Floral & Theme','Bespoke floral and theme decor — mandaps, entrance arches, stage backdrops and ambient lighting.','Patna',25.6400,85.1700,'on_request',null,null,null,null,'{"Floral mandap","Theme decor","Lighting","Entrance arch"}','published'),
  ('22222222-0000-0000-0000-000000000007','11111111-0000-0000-0000-000000000007','mehendi','Henna Stories — Bridal Mehendi','Intricate bridal mehendi with organic henna and personalised motifs, plus family packages.','Patna',25.5850,85.1250,'fixed',1500000,'per bride',null,null,'{"Bridal + family","Organic henna","Travels to venue","Custom motifs"}','published')
on conflict (id) do nothing;

-- Media ---------------------------------------------------------------------
insert into media (listing_id, url, alt, "order", approved) values
  ('22222222-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80','Grand decorated wedding lawn at dusk',0,true),
  ('22222222-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80','Banquet hall set for reception',1,true),
  ('22222222-0000-0000-0000-000000000001','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80','Couple under floral arch',2,true),
  ('22222222-0000-0000-0000-000000000002','https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=80','Elegant banquet hall with chandeliers',0,true),
  ('22222222-0000-0000-0000-000000000003','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1000&q=80','Bride with elegant bridal makeup',0,true),
  ('22222222-0000-0000-0000-000000000004','https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80','Candid wedding photography moment',0,true),
  ('22222222-0000-0000-0000-000000000005','https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1000&q=80','Lavish catering buffet spread',0,true),
  ('22222222-0000-0000-0000-000000000006','https://images.unsplash.com/photo-1509610973147-232dfea52a97?auto=format&fit=crop&w=1000&q=80','Floral mandap decoration',0,true),
  ('22222222-0000-0000-0000-000000000007','https://images.unsplash.com/photo-1610173827043-9db50e0d8ef9?auto=format&fit=crop&w=1000&q=80','Intricate bridal mehendi on hands',0,true)
on conflict do nothing;

-- Packages ------------------------------------------------------------------
insert into packages (listing_id, name, price_minor, price_unit, inclusions, active) values
  ('22222222-0000-0000-0000-000000000001','Silver — Lawn only',45000000,'per event','{"Lawn for up to 600","Basic stage & lighting","Parking","Power backup"}',true),
  ('22222222-0000-0000-0000-000000000001','Gold — Lawn + Banquet',65000000,'per event','{"Lawn + AC banquet","Premium decor","In-house catering (veg)","Bridal room","DJ"}',true),
  ('22222222-0000-0000-0000-000000000003','Bridal HD + Trial',2800000,'per booking','{"HD/airbrush bridal look","One trial session","Draping","False lashes"}',true),
  ('22222222-0000-0000-0000-000000000003','Family add-on',600000,'per person','{"Party makeup","Draping","Hairstyling"}',true)
on conflict do nothing;

-- Products ------------------------------------------------------------------
insert into products (id, category, name, seller, city, price_minor, price_unit, rating, review_count, image_url, image_alt, description) values
  ('33333333-0000-0000-0000-000000000001','invitations','Royal Gold Foil Invitation','Patna Print House','Patna',12000,'per card',4.8,64,'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=800&q=80','Gold foil wedding invitation card','Hand-finished gold foil invitations on premium textured stock. Minimum order 100 cards.'),
  ('33333333-0000-0000-0000-000000000002','wedding_wear','Hand-embroidered Bridal Lehenga','Rivaaj Couture','Patna',8500000,'per piece',4.9,41,'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80','Red bridal lehenga with embroidery','Custom-tailored bridal lehenga with zardozi hand embroidery. 4-6 week lead time.'),
  ('33333333-0000-0000-0000-000000000003','jewellery','Polki Bridal Jewellery Set','Sona Jewellers','Patna',12500000,'per set',4.7,28,'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80','Polki bridal necklace set','Uncut polki necklace, earrings and maang tikka. Hallmarked, with certificate.'),
  ('33333333-0000-0000-0000-000000000004','gifting','Luxury Wedding Gift Hamper','Shagun Boxes','Patna',250000,'per hamper',4.6,112,'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80','Decorated wedding gift hamper','Curated dry-fruit and sweets hampers with custom ribboning. Bulk pricing available.'),
  ('33333333-0000-0000-0000-000000000005','cakes','Three-tier Wedding Cake','Sugar & Spice Bakers','Patna',800000,'per cake',4.8,76,'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80','Three tier white wedding cake','Customisable three-tier fondant cake with fresh-flower finish. Eggless option available.'),
  ('33333333-0000-0000-0000-000000000006','favours','Personalised Guest Favours','Little Tokens','Patna',15000,'per favour',4.7,53,'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80','Wedding guest favour boxes','Personalised mini favours — candles, chocolates or potli bags. Minimum 50 units.')
on conflict (id) do nothing;

-- Remote config -------------------------------------------------------------
insert into remote_config (key, value) values
  ('home_hero', '{"title":"Plan Your Dream Wedding","subtitle":"Venues, vendors & everything you need","badge":"India''s #1 Wedding Marketplace"}'),
  ('trust_stats', '{"verified_vendors":"1,000+","happy_couples":"2,000+","cities":"100+"}'),
  ('min_supported_version', '{"android":"1.0.0"}')
on conflict (key) do update set value = excluded.value, updated_at = now();
