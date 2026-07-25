import type {
  Booking,
  Conversation,
  Enquiry,
  Listing,
  Message,
  PlannerMilestone,
  Review,
} from '@/types/domain'

/** Deterministic fixtures — a stand-in for the Supabase backend during Phases 1–3. */

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const listings: Listing[] = [
  {
    id: 'lst_usha_resort',
    vendorId: 'ven_usha',
    vendorName: 'Usha Resort',
    category: 'venue',
    title: 'Usha Resort — Lawn & Banquet',
    city: 'Patna',
    distanceKm: 4.2,
    rating: 5.0,
    reviewCount: 128,
    verified: true,
    priceMode: 'fixed',
    fromPrice: { minorUnits: 45000000, currency: 'INR', unit: 'per event' },
    coverImage: { id: 'm1', url: img('1519741497674-611481863552', 1000), alt: 'Grand decorated wedding lawn at dusk', order: 0 },
    gallery: [
      { id: 'm1a', url: img('1519741497674-611481863552'), alt: 'Wedding lawn with floral mandap', order: 0 },
      { id: 'm1b', url: img('1464366400600-7168b8af9bc3'), alt: 'Banquet hall set for reception', order: 1 },
      { id: 'm1c', url: img('1522335789203-aabd1fc54bc9'), alt: 'Couple under floral arch', order: 2 },
    ],
    amenities: ['Parking 200+', 'In-house catering', 'AC banquet', 'Bridal room', 'DJ allowed'],
    capacityMin: 200,
    capacityMax: 1200,
    status: 'published',
    description:
      'A premier lawn-and-banquet venue in Patna with landscaped gardens, a 1,200-guest capacity and in-house catering. Ideal for grand weddings and receptions.',
    packages: [
      {
        id: 'pkg_usha_silver',
        name: 'Silver — Lawn only',
        price: { minorUnits: 45000000, currency: 'INR', unit: 'per event' },
        priceMode: 'fixed',
        inclusions: ['Lawn for up to 600', 'Basic stage & lighting', 'Parking', 'Power backup'],
        active: true,
      },
      {
        id: 'pkg_usha_gold',
        name: 'Gold — Lawn + Banquet',
        price: { minorUnits: 65000000, currency: 'INR', unit: 'per event' },
        priceMode: 'fixed',
        inclusions: ['Lawn + AC banquet', 'Premium decor', 'In-house catering (veg)', 'Bridal room', 'DJ'],
        active: true,
      },
    ],
  },
  {
    id: 'lst_reeti_rivaaj',
    vendorId: 'ven_reeti',
    vendorName: 'Reeti Rivaaj Banquet',
    category: 'venue',
    title: 'Reeti Rivaaj Banquet',
    city: 'Patna',
    distanceKm: 6.8,
    rating: 4.9,
    reviewCount: 94,
    verified: true,
    priceMode: 'fixed',
    fromPrice: { minorUnits: 52500000, currency: 'INR', unit: 'per event' },
    coverImage: { id: 'm2', url: img('1464366400600-7168b8af9bc3', 1000), alt: 'Elegant banquet hall with chandeliers', order: 0 },
    gallery: [
      { id: 'm2a', url: img('1464366400600-7168b8af9bc3'), alt: 'Banquet hall with round tables', order: 0 },
      { id: 'm2b', url: img('1507504031003-b417219a0fde'), alt: 'Reception stage decor', order: 1 },
    ],
    amenities: ['Valet parking', 'AC hall', 'Catering', 'Stage decor', 'Rooms'],
    capacityMin: 150,
    capacityMax: 800,
    status: 'published',
    description:
      'A refined indoor banquet with chandelier lighting and customisable stage decor, seating up to 800 guests in air-conditioned comfort.',
  },
  {
    id: 'lst_rhea_makeup',
    vendorId: 'ven_rhea',
    vendorName: 'Makeovers by Rhea',
    category: 'makeup',
    title: 'Makeovers by Rhea — Bridal Makeup',
    city: 'Patna',
    distanceKm: 3.1,
    rating: 4.9,
    reviewCount: 212,
    verified: true,
    priceMode: 'fixed',
    fromPrice: { minorUnits: 2800000, currency: 'INR', unit: 'per booking' },
    coverImage: { id: 'm3', url: img('1487412947147-5cebf100ffc2', 1000), alt: 'Bride with elegant bridal makeup', order: 0 },
    gallery: [
      { id: 'm3a', url: img('1487412947147-5cebf100ffc2'), alt: 'Bridal makeup close-up', order: 0 },
      { id: 'm3b', url: img('1522335789203-aabd1fc54bc9'), alt: 'Bride portrait with jewellery', order: 1 },
    ],
    amenities: ['HD & airbrush', 'Trial available', 'Travels to venue', 'Draping included'],
    status: 'published',
    description:
      'Signature HD and airbrush bridal makeup with a complimentary trial. Rhea travels to your venue with a full team on the wedding day.',
    packages: [
      {
        id: 'pkg_rhea_bridal',
        name: 'Bridal HD + Trial',
        price: { minorUnits: 2800000, currency: 'INR', unit: 'per booking' },
        priceMode: 'fixed',
        inclusions: ['HD/airbrush bridal look', 'One trial session', 'Draping', 'False lashes'],
        active: true,
      },
      {
        id: 'pkg_rhea_family',
        name: 'Family add-on',
        price: { minorUnits: 600000, currency: 'INR', unit: 'per person' },
        priceMode: 'fixed',
        inclusions: ['Party makeup', 'Draping', 'Hairstyling'],
        active: true,
      },
    ],
  },
  {
    id: 'lst_frames_photo',
    vendorId: 'ven_frames',
    vendorName: 'Frames & Feels',
    category: 'photography',
    title: 'Frames & Feels — Candid Photography',
    city: 'Patna',
    distanceKm: 5.4,
    rating: 4.8,
    reviewCount: 76,
    verified: true,
    priceMode: 'fixed',
    fromPrice: { minorUnits: 8500000, currency: 'INR', unit: 'per day' },
    coverImage: { id: 'm4', url: img('1519167758481-83f550bb49b3', 1000), alt: 'Candid wedding photography moment', order: 0 },
    gallery: [
      { id: 'm4a', url: img('1519167758481-83f550bb49b3'), alt: 'Couple candid shot', order: 0 },
      { id: 'm4b', url: img('1606216794074-735e91aa2c92'), alt: 'Wedding rituals photograph', order: 1 },
    ],
    amenities: ['Candid + traditional', 'Cinematic film', 'Same-day teaser', 'Drone'],
    status: 'published',
    description:
      'A candid-first photography studio offering cinematic wedding films, same-day teasers and drone coverage across Bihar.',
  },
  {
    id: 'lst_annapurna_catering',
    vendorId: 'ven_annapurna',
    vendorName: 'Annapurna Caterers',
    category: 'catering',
    title: 'Annapurna Caterers — Multi-cuisine',
    city: 'Patna',
    distanceKm: 7.9,
    rating: 4.7,
    reviewCount: 143,
    verified: false,
    priceMode: 'fixed',
    fromPrice: { minorUnits: 85000, currency: 'INR', unit: 'per plate' },
    coverImage: { id: 'm5', url: img('1555244162-803834f70033', 1000), alt: 'Lavish catering buffet spread', order: 0 },
    gallery: [
      { id: 'm5a', url: img('1555244162-803834f70033'), alt: 'Buffet counters', order: 0 },
    ],
    amenities: ['Veg & non-veg', 'Live counters', 'Custom menu', 'Serving staff'],
    status: 'published',
    description:
      'Multi-cuisine wedding catering with live counters and customisable menus, from intimate gatherings to 1,000+ guest receptions.',
  },
  {
    id: 'lst_gulmohar_decor',
    vendorId: 'ven_gulmohar',
    vendorName: 'Gulmohar Decor',
    category: 'decor',
    title: 'Gulmohar Decor — Floral & Theme',
    city: 'Patna',
    distanceKm: 8.6,
    rating: 4.8,
    reviewCount: 58,
    verified: true,
    priceMode: 'on_request',
    coverImage: { id: 'm6', url: img('1509610973147-232dfea52a97', 1000), alt: 'Floral mandap decoration', order: 0 },
    gallery: [
      { id: 'm6a', url: img('1509610973147-232dfea52a97'), alt: 'Floral stage backdrop', order: 0 },
    ],
    amenities: ['Floral mandap', 'Theme decor', 'Lighting', 'Entrance arch'],
    status: 'published',
    description:
      'Bespoke floral and theme decor — mandaps, entrance arches, stage backdrops and ambient lighting tailored to your palette.',
  },
  {
    id: 'lst_henna_mehendi',
    vendorId: 'ven_henna',
    vendorName: 'Henna Stories',
    category: 'mehendi',
    title: 'Henna Stories — Bridal Mehendi',
    city: 'Patna',
    distanceKm: 2.4,
    rating: 4.9,
    reviewCount: 101,
    verified: true,
    priceMode: 'fixed',
    fromPrice: { minorUnits: 1500000, currency: 'INR', unit: 'per bride' },
    coverImage: { id: 'm7', url: img('1610173827043-9db50e0d8ef9', 1000), alt: 'Intricate bridal mehendi on hands', order: 0 },
    gallery: [
      { id: 'm7a', url: img('1610173827043-9db50e0d8ef9'), alt: 'Bridal mehendi design', order: 0 },
    ],
    amenities: ['Bridal + family', 'Organic henna', 'Travels to venue', 'Custom motifs'],
    status: 'published',
    description:
      'Intricate bridal mehendi with organic henna and personalised motifs, plus family packages at your venue.',
  },
]

export const reviews: Record<string, Review[]> = {
  lst_usha_resort: [
    { id: 'rv1', listingId: 'lst_usha_resort', author: 'Ananya & Rohit', rating: 5, body: 'The lawn looked magical and the staff handled 900 guests effortlessly. Highly recommend for a big fat Patna wedding.', verified: true, createdAt: '2026-06-20T10:00:00Z' },
    { id: 'rv2', listingId: 'lst_usha_resort', author: 'Priya S.', rating: 5, body: 'In-house catering was delicious and the bridal room was spacious. Worth every rupee.', verified: true, createdAt: '2026-05-11T10:00:00Z' },
  ],
}

export const plannerMilestones: PlannerMilestone[] = [
  { id: 'pm1', title: 'Set your wedding date', done: true, order: 0 },
  { id: 'pm2', title: 'Shortlist venues', done: true, order: 1 },
  { id: 'pm3', title: 'Book photographer', done: false, order: 2 },
  { id: 'pm4', title: 'Finalise catering menu', done: false, order: 3 },
  { id: 'pm5', title: 'Book makeup artist', done: false, order: 4 },
  { id: 'pm6', title: 'Confirm decor theme', done: false, order: 5 },
]

export const enquiriesCouple: Enquiry[] = [
  {
    id: 'enq1',
    listingId: 'lst_usha_resort',
    listingTitle: 'Usha Resort — Lawn & Banquet',
    vendorId: 'ven_usha',
    vendorName: 'Usha Resort',
    coupleName: 'You',
    eventDate: '2026-12-05',
    guests: 600,
    budget: { minorUnits: 60000000, currency: 'INR' },
    message: 'Looking for a lawn venue for 600 guests in December. Please share package details.',
    stage: 'contacted',
    createdAt: '2026-07-20T09:30:00Z',
  },
]

export const enquiriesVendor: Enquiry[] = [
  {
    id: 'lead1',
    listingId: 'lst_usha_resort',
    listingTitle: 'Usha Resort — Lawn & Banquet',
    vendorId: 'ven_usha',
    vendorName: 'Usha Resort',
    coupleName: 'Ananya Verma',
    eventDate: '2026-12-05',
    guests: 600,
    budget: { minorUnits: 60000000, currency: 'INR' },
    message: 'Looking for a lawn venue for 600 guests in December.',
    stage: 'new',
    createdAt: '2026-07-25T08:10:00Z',
    slaDueAt: '2026-07-25T09:10:00Z',
  },
  {
    id: 'lead2',
    listingId: 'lst_usha_resort',
    listingTitle: 'Usha Resort — Lawn & Banquet',
    vendorId: 'ven_usha',
    vendorName: 'Usha Resort',
    coupleName: 'Kabir & Meera',
    eventDate: '2027-02-14',
    guests: 350,
    message: 'Is the banquet available for a Valentine’s Day reception?',
    stage: 'quoted',
    createdAt: '2026-07-24T14:00:00Z',
  },
]

export const bookingsCouple: Booking[] = [
  {
    id: 'bk1',
    listingId: 'lst_rhea_makeup',
    listingTitle: 'Makeovers by Rhea — Bridal Makeup',
    vendorName: 'Makeovers by Rhea',
    eventDate: '2026-12-05',
    guests: 1,
    packageSnapshot: { name: 'Bridal HD + Trial', price: { minorUnits: 2800000, currency: 'INR' } },
    status: 'confirmed',
    createdAt: '2026-07-18T11:00:00Z',
  },
]

export const conversations: Conversation[] = [
  {
    id: 'cnv1',
    listingId: 'lst_usha_resort',
    vendorName: 'Usha Resort',
    coupleName: 'You',
    lastMessage: 'We can hold December 5th for you — shall I share the package?',
    lastAt: '2026-07-25T07:45:00Z',
    unread: 2,
  },
]

export const messages: Record<string, Message[]> = {
  cnv1: [
    { id: 'msg1', conversationId: 'cnv1', senderId: 'you', body: 'Hi! Is the lawn available on 5th December for 600 guests?', state: 'read', createdAt: '2026-07-25T07:30:00Z' },
    { id: 'msg2', conversationId: 'cnv1', senderId: 'ven_usha', body: 'We can hold December 5th for you — shall I share the package?', state: 'delivered', createdAt: '2026-07-25T07:45:00Z' },
  ],
}
