import dbConnect from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/apiHelpers';
import bcrypt from 'bcryptjs';

// ── Image pools by category (Picsum stable seeds) ─────────────
const IMAGES = {
  art:         [101,102,103,104,105,106,107,108],
  travel:      [200,201,202,203,204,205,206,207],
  food:        [292,293,294,295,296,297,298,299],
  fashion:     [400,401,402,403,404,405,406,407],
  nature:      [10,11,12,13,14,15,16,17,18,19],
  tech:        [0,1,2,3,4,5,6,7],
  fitness:     [416,417,418,419,420,421,422,423],
  home:        [164,165,166,167,168,169,170,171],
  photography: [500,501,502,503,504,505,506,507],
  animals:     [237,238,239,240,241,242,243,244],
};
const ALL_SEEDS = Object.values(IMAGES).flat();
const img = (seed, w=800, h=1000) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const slug = (s) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).slice(2,6);

// ── User definitions ──────────────────────────────────────────
const USERS = [
  { u:'alex_creates',   n:'Alex Carter',     bio:'Digital artist & illustrator 🎨',         cat:'art' },
  { u:'marina_shots',   n:'Marina Singh',    bio:'Travel photographer exploring the world ✈️', cat:'travel' },
  { u:'tech_tom',       n:'Tom Richards',    bio:'Software engineer & gadget reviewer 💻',   cat:'tech' },
  { u:'foodie_priya',   n:'Priya Sharma',    bio:'Home chef | Food blogger 🍜',             cat:'food' },
  { u:'wild_jake',      n:'Jake Wilde',       bio:'Nature lover & landscape photographer 🌿', cat:'nature' },
  { u:'style_sofia',   n:'Sofia Morales',   bio:'Fashion & lifestyle content creator 👗',  cat:'fashion' },
  { u:'fit_ryan',       n:'Ryan Brooks',     bio:'Personal trainer | Wellness coach 💪',    cat:'fitness' },
  { u:'home_hana',      n:'Hana Inoue',      bio:'Interior designer & home decor lover 🏠', cat:'home' },
  { u:'pixel_pete',     n:'Pete Larson',     bio:'Portrait & street photographer 📷',       cat:'photography' },
  { u:'animal_amy',     n:'Amy Chen',        bio:'Wildlife enthusiast & animal rescue 🐾',  cat:'animals' },
  { u:'art_mia',        n:'Mia Johnson',     bio:'Watercolor & mixed media artist 🖌️',      cat:'art' },
  { u:'globe_trotter',  n:'Carlos Rivera',   bio:'Backpacker | 47 countries and counting 🌍', cat:'travel' },
  { u:'dev_diana',      n:'Diana Patel',     bio:'Full stack dev | Open source contributor', cat:'tech' },
  { u:'chef_marco',     n:'Marco Rossi',     bio:'Italian food lover & pasta maker 🍝',     cat:'food' },
  { u:'forest_finn',    n:'Finn Larsen',     bio:'Forest bathing & mindfulness advocate 🌲', cat:'nature' },
  { u:'style_zara',     n:'Zara Ahmed',      bio:'Sustainable fashion blogger ♻️',           cat:'fashion' },
  { u:'yoga_yuki',      n:'Yuki Tanaka',     bio:'Yoga teacher | Mind body spirit 🧘',      cat:'fitness' },
  { u:'deco_lena',      n:'Lena Meyer',      bio:'Scandinavian minimalist design lover 🪴',  cat:'home' },
  { u:'lens_leo',       n:'Leo Okafor',      bio:'Landscape & architecture photographer 🏛️', cat:'photography' },
  { u:'pet_petra',      n:'Petra Novak',     bio:'Cat mom x3 | Pet care tips daily 🐱',    cat:'animals' },
  { u:'brush_ben',      n:'Ben Hartley',     bio:'Street art & graffiti documentation 🎭',  cat:'art' },
  { u:'road_rosa',      n:'Rosa Kim',        bio:'Solo travel | Budget backpacking 🎒',     cat:'travel' },
  { u:'code_kai',       n:'Kai Nakamura',    bio:'AI researcher | Machine learning 🤖',     cat:'tech' },
  { u:'bake_bella',     n:'Bella Thompson',  bio:'Sourdough obsessed | Pastry chef 🥐',     cat:'food' },
  { u:'eco_ethan',      n:'Ethan Moore',     bio:'Environmental activist & nature guide 🌱', cat:'nature' },
  { u:'trend_tia',      n:'Tia Wilson',      bio:'Streetwear collector | Fashion week obsessed', cat:'fashion' },
  { u:'run_rafael',     n:'Rafael Santos',   bio:'Marathon runner | Nutrition coach 🏃',    cat:'fitness' },
  { u:'room_riya',      n:'Riya Gupta',      bio:'Room makeovers on a budget 💡',           cat:'home' },
  { u:'snap_sam',       n:'Sam O\'Brien',    bio:'Documentary & photojournalism 📰',        cat:'photography' },
  { u:'fur_fiona',      n:'Fiona Walsh',     bio:'Dog trainer & behaviour specialist 🐕',   cat:'animals' },
  { u:'sketch_soren',   n:'Søren Hansen',    bio:'Concept artist for games & film 🎮',     cat:'art' },
  { u:'nomad_nadia',    n:'Nadia Petrov',    bio:'Digital nomad | Remote work lifestyle 💻', cat:'travel' },
  { u:'ux_uma',         n:'Uma Krishnan',    bio:'UX designer | Figma enthusiast 🎨',       cat:'tech' },
  { u:'spice_sara',     n:'Sara Okonkwo',    bio:'West African cuisine lover & recipe creator', cat:'food' },
  { u:'bloom_bo',       n:'Bo Andersen',     bio:'Botany & wildflower photography 🌸',     cat:'nature' },
  { u:'minimal_max',    n:'Max Schreiber',   bio:'Minimalist wardrobe | Capsule fashion 🖤', cat:'fashion' },
  { u:'swim_sasha',     n:'Sasha Lee',       bio:'Open water swimmer | Triathlete 🏊',     cat:'fitness' },
  { u:'shelf_shira',    n:'Shira Cohen',     bio:'Bookshelf styling & reading nooks 📚',   cat:'home' },
  { u:'glow_grace',     n:'Grace Mensah',    bio:'Natural light portrait photographer ☀️',  cat:'photography' },
  { u:'bird_blake',     n:'Blake Turner',    bio:'Birdwatcher | Avian photography enthusiast 🦜', cat:'animals' },
  { u:'ink_ivan',       n:'Ivan Sokolov',    bio:'Tattoo artist & illustrator 🖋️',          cat:'art' },
  { u:'sail_stella',    n:'Stella Papadopoulos', bio:'Sailor | Coastal travel stories ⛵', cat:'travel' },
  { u:'cloud_clara',    n:'Clara Dubois',    bio:'Cloud computing & DevOps advocate ☁️',   cat:'tech' },
  { u:'ramen_rick',     n:'Rick Hayashi',    bio:'Ramen connoisseur | Japanese cuisine 🍜', cat:'food' },
  { u:'meadow_mai',     n:'Mai Nguyen',      bio:'Wildflower meadows & organic farming 🌻', cat:'nature' },
  { u:'thrift_theo',    n:'Theo Bergman',    bio:'Thrift store fashion | Vintage finds 🕶️', cat:'fashion' },
  { u:'climb_cole',     n:'Cole Murphy',     bio:'Rock climber | Outdoor adventure 🧗',    cat:'fitness' },
  { u:'loft_luca',      n:'Luca Ferrari',    bio:'Industrial loft design & architecture 🏗️', cat:'home' },
  { u:'macro_mali',     n:'Mali Johansson',  bio:'Macro photography | Tiny world details 🔬', cat:'photography' },
  { u:'rescue_rex',     n:'Rex Olawale',     bio:'Animal rescue volunteer | Foster family 🐶', cat:'animals' },
];

const COMMENTS = [
  'Absolutely stunning! 😍','This is so inspiring!','Love this aesthetic so much 💕',
  'Goals! 🙌','This made my day better ✨','Where is this??','Amazing shot!',
  'Can you share more details?','So beautiful 😭','I need this in my life!',
  'Incredible work as always 🔥','This is everything 💯','Saved for inspo!',
  'The lighting here is perfect 👌','Such a vibe 🌊','Wow, the colors!',
  'This is exactly what I needed to see today 💫','Major talent!','Obsessed 😩',
  'This should be way more popular','Following for more like this!','Breathtaking 🌅',
];

const BOARD_NAMES = {
  art:         ['Art Inspiration','Color Theory','Illustration Styles','Sketchbook Ideas'],
  travel:      ['Dream Destinations','City Guides','Hidden Gems','Travel Photography'],
  tech:        ['Tech Setups','Gadget Wishlist','Dev Resources','UI Inspiration'],
  food:        ['Recipe Ideas','Food Photography','Restaurant Wishlist','Meal Prep'],
  nature:      ['Nature Photography','Landscape Goals','Plant Life','Wildlife Wonders'],
  fashion:     ['Outfit Ideas','Style Inspo','Wardrobe Goals','Seasonal Looks'],
  fitness:     ['Workout Plans','Gym Aesthetic','Healthy Recipes','Active Lifestyle'],
  home:        ['Home Decor','Room Makeovers','Kitchen Inspo','Cozy Corners'],
  photography: ['Composition Study','Light & Shadow','Portrait Tips','Camera Gear'],
  animals:     ['Animal Portraits','Pet Care Tips','Wildlife','Cute Overload'],
};

const PIN_TITLES = {
  art:         ['Golden Hour Illustration','Abstract Color Study','Minimalist Portrait','Ink & Watercolor','Digital Dreamscape'],
  travel:      ['Hidden Beach Paradise','City Rooftop Views','Mountain Sunrise','Ancient Temples','Neon City Nights'],
  tech:        ['Perfect Desk Setup','Minimal Workstation','Dual Monitor Build','Cable Management','RGB Aesthetic'],
  food:        ['Homemade Pasta Night','Matcha Latte Art','Sunday Brunch Spread','Street Food Finds','Farmers Market Haul'],
  nature:      ['Forest Fog Morning','Wildflower Fields','Autumn Reflections','Desert Sand Dunes','Misty Mountain Views'],
  fashion:     ['Effortless Summer Look','Vintage Denim Vibes','Monochrome Moment','Cozy Knit Season','Street Style Snap'],
  fitness:     ['Morning Run Golden Hour','Home Gym Setup','Post-Workout Glow','Healthy Meal Prep','Yoga Sunrise Flow'],
  home:        ['Cozy Reading Corner','Minimalist Bedroom','Kitchen Refresh','Plants Everywhere','Gallery Wall Ideas'],
  photography: ['Golden Hour Portrait','Blue Hour Cityscape','Abstract Light Trails','Intimate Close-up','Candid Street Life'],
  animals:     ['Morning Zoomies','Cat Window Perch','Puppy Portraits','Wildlife Encounter','Rescue Day One'],
};

const CATEGORIES = [
  { name:'Art & Illustration', slug:'art', emoji:'🎨', color:'#e74c3c', type:'category' },
  { name:'Travel', slug:'travel', emoji:'✈️', color:'#3498db', type:'category' },
  { name:'Technology', slug:'tech', emoji:'💻', color:'#2ecc71', type:'category' },
  { name:'Food & Recipes', slug:'food', emoji:'🍕', color:'#f39c12', type:'category' },
  { name:'Nature', slug:'nature', emoji:'🌿', color:'#27ae60', type:'category' },
  { name:'Fashion', slug:'fashion', emoji:'👗', color:'#9b59b6', type:'category' },
  { name:'Fitness', slug:'fitness', emoji:'💪', color:'#e67e22', type:'category' },
  { name:'Home Decor', slug:'home', emoji:'🏠', color:'#1abc9c', type:'category' },
  { name:'Photography', slug:'photography', emoji:'📸', color:'#34495e', type:'category' },
  { name:'Animals & Pets', slug:'animals', emoji:'🐾', color:'#e91e63', type:'category' },
  { name:'Architecture', slug:'architecture', emoji:'🏛️', color:'#607d8b', type:'category' },
  { name:'Music', slug:'music', emoji:'🎵', color:'#ff5722', type:'category' },
];

const TAGS = [
  'aesthetic','minimalist','vintage','cozy','wanderlust','foodie','streetstyle',
  'interiordesign','macro','goldenhour','darkacademia','cottagecore','y2k',
  'moody','dreamy','lifestyle','inspiration','portrait-shots','landscapes','city-architecture',
];

const FLAGS = [
  { key:'ai_captions', label:'AI Captions', enabled:true },
  { key:'ai_hashtags', label:'AI Hashtags', enabled:true },
  { key:'ai_toxic_filter', label:'AI Toxic Comment Filter', enabled:false },
  { key:'nsfw_detection', label:'NSFW Detection', enabled:true },
  { key:'monetization', label:'Monetization / Tips', enabled:true },
  { key:'creator_subscriptions', label:'Creator Subscriptions', enabled:true },
  { key:'affiliate_pins', label:'Affiliate Pins', enabled:true },
  { key:'sponsored_pins', label:'Sponsored Pins', enabled:true },
  { key:'brand_collaborations', label:'Brand Collaborations', enabled:true },
  { key:'analytics_export', label:'Analytics Export', enabled:true },
  { key:'private_vault', label:'Private Vault Boards', enabled:true },
  { key:'scheduled_pins', label:'Scheduled Pins', enabled:true },
];

export async function GET(request) {
  if (process.env.NODE_ENV !== 'development') {
    return apiError('Seed only available in development', 403);
  }

  try {
    await dbConnect();

    // Dynamically import all models
    const [
      User, Pin, Board, Comment, Activity, CategoryTag,
      FeatureFlag, SystemSettings, Earnings, SavedPin, Notification
    ] = await Promise.all([
      import('@/models/User').then(m => m.default),
      import('@/models/Pin').then(m => m.default),
      import('@/models/Board').then(m => m.default),
      import('@/models/Comment').then(m => m.default),
      import('@/models/Activity').then(m => m.default),
      import('@/models/CategoryTag').then(m => m.default),
      import('@/models/FeatureFlag').then(m => m.default),
      import('@/models/SystemSettings').then(m => m.default),
      import('@/models/Earnings').then(m => m.default),
      import('@/models/SavedPin').then(m => m.default),
      import('@/models/Notification').then(m => m.default),
    ]);

    // ── 1. Clear non-admin data ────────────────────────────────
    await Promise.all([
      User.deleteMany({ role: { $ne: 'admin' } }),
      Pin.deleteMany({}),
      Board.deleteMany({}),
      Comment.deleteMany({}),
      Activity.deleteMany({}),
      CategoryTag.deleteMany({}),
      FeatureFlag.deleteMany({}),
      Earnings.deleteMany({}),
      SavedPin.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    await SystemSettings.deleteMany({});

    const adminUser = await User.findOne({ role: 'admin' });

    // ── 2. System settings ─────────────────────────────────────
    await SystemSettings.create({
      trending: { weightViews: 1, weightSaves: 3, weightLikes: 2, decayFactor: 0.9 },
      platform: { maintenanceMode: false, registrationOpen: true },
      upload: { maxFileSize: 20 },
    });

    // ── 3. Categories ────────────────────────────────────────────────
    const createdCategories = await CategoryTag.insertMany(
      CATEGORIES.map(c => ({ ...c, isActive: true, isFeatured: true, createdBy: adminUser?._id })),
      { ordered: false }
    ).catch(e => { if (e.code !== 11000) throw e; return []; });

    // ── 4. Tags ────────────────────────────────────────────────────
    await CategoryTag.insertMany(
      TAGS.map(t => ({ name: t, slug: t, type: 'tag', emoji: '', color: '#607d8b', isActive: true, createdBy: adminUser?._id })),
      { ordered: false }
    ).catch(e => { if (e.code !== 11000) throw e; });

    // ── 5. Feature flags ───────────────────────────────────────
    await FeatureFlag.insertMany(FLAGS.map(f => ({ ...f, description: f.label, rolloutPercent: 100 })));

    // ── 6. Create 50 users ─────────────────────────────────────
    const pw = await bcrypt.hash('Picify@123', 10);
    const CREATOR_INDICES = [0,1,3,4,5,6,9,12,15,19,22,25,28,31,34,37,40,43,46,49];

    const userDocs = await User.insertMany(USERS.map((u, i) => ({
      username: u.u,
      displayName: u.n,
      email: `${u.u}@picify.dev`,
      password: pw,
      bio: u.bio,
      profileImage: img(ALL_SEEDS[i % ALL_SEEDS.length], 200, 200),
      coverImage: img(ALL_SEEDS[(i + 10) % ALL_SEEDS.length], 1200, 400),
      role: 'user',
      isActive: true,
      isVerified: i % 5 === 0,
      isCreator: true,
      emailVerified: true,
      tipsEnabled: CREATOR_INDICES.includes(i),
      brandCollabsEnabled: CREATOR_INDICES.includes(i),
      creatorSubscriptionsEnabled: CREATOR_INDICES.includes(i),
      subscriptionPrice: CREATOR_INDICES.includes(i) ? rnd([299,499,999,1499]) : 499,
      lastLogin: new Date(Date.now() - rndInt(0, 7) * 86400000),
    })));

    // ── 7. Follow relationships ────────────────────────────────
    for (let i = 0; i < userDocs.length; i++) {
      const toFollow = pick(userDocs.filter((_, j) => j !== i), rndInt(5, 15));
      const followIds = toFollow.map(u => u._id);
      await User.findByIdAndUpdate(userDocs[i]._id, {
        following: followIds, followingCount: followIds.length,
      });
      for (const fid of followIds) {
        await User.findByIdAndUpdate(fid, {
          $push: { followers: userDocs[i]._id },
          $inc: { followersCount: 1 },
        });
      }
    }

    // ── 8. Boards ──────────────────────────────────────────────
    const allBoards = [];
    for (const user of userDocs) {
      const cat = USERS.find(u => u.u === user.username)?.cat || 'art';
      const names = BOARD_NAMES[cat] || BOARD_NAMES.art;
      const boardCount = rndInt(2, 4);
      for (let b = 0; b < boardCount; b++) {
        const board = await Board.create({
          userId: user._id,
          name: names[b % names.length],
          slug: slug(names[b % names.length]),
          isPublic: b !== 0 || Math.random() > 0.2,
          coverImage: img(rnd(ALL_SEEDS), 400, 300),
          pinsCount: 0,
        });
        allBoards.push({ board, userId: user._id });
      }
    }

    // ── 9. Pins ────────────────────────────────────────────────
    const allPins = [];
    for (const user of userDocs) {
      const cat = USERS.find(u => u.u === user.username)?.cat || 'art';
      const catImages = IMAGES[cat] || ALL_SEEDS;
      const titles = PIN_TITLES[cat] || PIN_TITLES.art;
      const pinCount = rndInt(4, 10);
      const userBoards = allBoards.filter(b => b.userId.equals(user._id));

      for (let p = 0; p < pinCount; p++) {
        const imgSeed = catImages[p % catImages.length];
        const isCreator = CREATOR_INDICES.includes(userDocs.indexOf(user));
        const board = rnd(userBoards)?.board;

        const pin = await Pin.create({
          userId: user._id,
          title: titles[p % titles.length],
          description: `${user.bio} — Captured this beautiful moment and couldn't wait to share it with you all. ${rnd(['✨','🔥','💕','🌟','👌'])}`,
          images: [{ url: img(imgSeed), width: 800, height: 1000, format: 'jpeg' }],
          tags: pick(TAGS, rndInt(3, 6)),
          categories: [cat],
          isPublic: true,
          isDraft: false,
          boardId: board?._id,
          orientation: 'portrait',
          publishedAt: new Date(Date.now() - rndInt(0, 90) * 86400000),
          affiliateLink: isCreator && p === 0 ? 'https://amazon.com/s?k=photography+gear' : undefined,
          isSponsored: isCreator && p === 1,
          views: rndInt(50, 5000),
          likesCount: 0,
          savesCount: 0,
          commentsCount: 0,
        });
        allPins.push(pin);

        if (board) {
          await Board.findByIdAndUpdate(board._id, { $inc: { pinsCount: 1 }, coverImage: img(imgSeed, 400, 300) });
        }
      }
    }

    // ── 10. Likes & Saves ──────────────────────────────────────
    for (const pin of allPins) {
      const likers = pick(userDocs, rndInt(2, 20));
      const savers = pick(userDocs, rndInt(1, 10));
      await Pin.findByIdAndUpdate(pin._id, {
        likes: likers.map(u => u._id),
        likesCount: likers.length,
        saves: savers.map(u => u._id),
        savesCount: savers.length,
      });
      for (const s of savers) {
        await SavedPin.create({ userId: s._id, pinId: pin._id }).catch(() => {});
      }
    }

    // ── 11. Comments ───────────────────────────────────────────
    const samplePins = pick(allPins, Math.min(allPins.length, 100));
    for (const pin of samplePins) {
      const commenters = pick(userDocs, rndInt(2, 8));
      let count = 0;
      for (const commenter of commenters) {
        await Comment.create({
          pinId: pin._id,
          userId: commenter._id,
          text: rnd(COMMENTS),
          likesCount: rndInt(0, 15),
        });
        count++;
      }
      await Pin.findByIdAndUpdate(pin._id, { commentsCount: count });
    }

    // ── 12. Activity feed ──────────────────────────────────────
    const actSample = pick(allPins, 60);
    for (const pin of actSample) {
      const actor = rnd(userDocs);
      await Activity.create({
        userId: actor._id,
        type: rnd(['pin_liked','pin_saved','pin_created','user_followed']),
        entityId: pin._id,
        entityType: 'pin',
      }).catch(() => {});
    }

    // ── 13. Earnings for creators (per-transaction) ────────────
    for (const idx of CREATOR_INDICES) {
      const user = userDocs[idx];
      if (!user) continue;
      const txCount = rndInt(5, 20);
      const types = ['tip','subscription','affiliate','brand_deal','sponsored_pin'];
      const fromUsers = pick(userDocs, txCount);
      for (let t = 0; t < txCount; t++) {
        await Earnings.create({
          userId: user._id,
          type: rnd(types),
          amount: rndInt(5, 500) * 100,
          status: rnd(['completed','completed','completed','pending']),
          fromUserId: fromUsers[t]?._id,
          pinId: rnd(allPins)?._id,
          note: rnd(['Great content!','Love your work!','Keep it up!','Amazing pin!']),
          createdAt: new Date(Date.now() - rndInt(0,60)*86400000),
        }).catch(() => {});
      }
    }

    // ── 14. Notifications ──────────────────────────────────────
    for (const user of pick(userDocs, 30)) {
      const actors = pick(userDocs.filter(u => !u._id.equals(user._id)), rndInt(2,5));
      for (const actor of actors) {
        await Notification.create({
          userId: user._id,      // recipient
          actorId: actor._id,
          type: rnd(['like','comment','follow','save','mention']),
          entityId: rnd(allPins)._id,
          entityType: 'pin',
          message: rnd(COMMENTS),
          isRead: Math.random() > 0.5,
        }).catch(() => {});
      }
    }

    return apiSuccess({
      message: '✅ Seed complete!',
      counts: {
        users: userDocs.length,
        pins: allPins.length,
        boards: allBoards.length,
        categories: createdCategories.length,
      },
      credentials: {
        password: 'Picify@123',
        admin: { username: adminUser?.username || 'admin', note: 'existing admin unchanged' },
        users: USERS.map(u => ({ username: u.u, email: `${u.u}@picify.dev`, displayName: u.n })),
      },
    });

  } catch (err) {
    console.error('[SEED ERROR]', err);
    return apiError('Seed failed: ' + err.message, 500);
  }
}
