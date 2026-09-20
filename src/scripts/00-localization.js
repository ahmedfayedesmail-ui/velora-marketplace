// ============================================================
    // VELORA — SUPABASE CONNECTION
    // ============================================================

    const MAHA_SUPABASE_URL = 'https://arlaxqmhtvjwjbjinjfw.supabase.co';

    const MAHA_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RDyqYgvJyT37RiQ1PNxYuQ_ov_8eceA';

    window.mahaSupabase = window.supabase.createClient(
        MAHA_SUPABASE_URL,
        MAHA_SUPABASE_PUBLISHABLE_KEY
    );
    // Staging-only compatibility aliases for legacy modules.
    window.supabaseClient = window.mahaSupabase;
    window.db = window.mahaSupabase;
    window.sb = window.mahaSupabase;

    console.log('✅ Velora — Supabase connected');

/* ===== VELORA CORE APPLICATION (Stages 3-15, consolidated) ===== */
/* ============================================
   VELORA - Data Layer
   المنتجات + المقالات + المراجعات
   ============================================ */

console.log('📦 Loading data...');

/* ============ PRODUCTS - 50 منتج ============ */
const PRODUCTS = [
    // ============ SKINCARE (20) ============
    {
        id: 'sk-001',
        name: 'Vitamin C Serum 20%',
        brand: 'The Ordinary',
        category: 'skincare',
        subcategory: 'Serum',
        emoji: '🍊',
        price: 250,
        oldPrice: 320,
        rating: 4.7,
        reviewsCount: 128,
        stock: 50,
        badge: 'bestseller',
        ingredients: ['Vitamin C 20%', 'Hyaluronic Acid', 'Phenol'],
        bestFor: ['Dull Skin', 'Pigmentation', 'Glow'],
        skinType: ['Normal', 'Oily', 'Combination'],
        pros: ['Very Effective', 'Good Price', 'Available'],
        cons: ['Oxidizes Quickly', 'May Tingle'],
        usage: 'Morning before moisturizer, 3-4 drops',
        description: 'A powerful Vitamin C serum that brightens skin and fights pigmentation.',
        tags: ['vitamin c', 'serum', 'brightening', 'glow']
    },
    {
        id: 'sk-002',
        name: 'Salicylic Acid Cleanser',
        brand: 'CeraVe',
        category: 'skincare',
        subcategory: 'Cleanser',
        emoji: '🧼',
        price: 320,
        oldPrice: 400,
        rating: 4.8,
        reviewsCount: 245,
        stock: 80,
        badge: 'bestseller',
        ingredients: ['Salicylic Acid 2%', 'Ceramides', 'Niacinamide'],
        bestFor: ['Acne', 'Blackheads', 'Oily Skin'],
        skinType: ['Oily', 'Combination'],
        pros: ['Deep Cleansing', 'Non-Drying', 'Daily Use'],
        cons: ['Not Enough for Dry Skin'],
        usage: 'Twice daily',
        description: 'A gentle yet effective cleanser that fights acne without over-drying.',
        tags: ['cleanser', 'salicylic', 'acne', 'oily']
    },
    {
        id: 'sk-003',
        name: 'Moisturizing Cream with Ceramides',
        brand: 'CeraVe',
        category: 'skincare',
        subcategory: 'Moisturizer',
        emoji: '💧',
        price: 380,
        oldPrice: 480,
        rating: 4.9,
        reviewsCount: 412,
        stock: 100,
        badge: 'bestseller',
        ingredients: ['Ceramides', 'Hyaluronic Acid', 'Glycerin'],
        bestFor: ['Deep Hydration', 'Dry Skin', 'Skin Barrier'],
        skinType: ['Dry', 'Normal', 'Sensitive'],
        pros: ['Strong Hydration', 'Fragrance-Free', 'Sensitive Skin'],
        cons: ['Heavy for Oily Skin'],
        usage: 'Morning and evening',
        description: 'Rich moisturizer with ceramides to restore and protect skin barrier.',
        tags: ['moisturizer', 'ceramide', 'hydration', 'dry']
    },
    {
        id: 'sk-004',
        name: 'Sunscreen SPF 50',
        brand: 'La Roche-Posay',
        category: 'skincare',
        subcategory: 'Sunscreen',
        emoji: '☀️',
        price: 650,
        oldPrice: 800,
        rating: 4.8,
        reviewsCount: 189,
        stock: 60,
        badge: 'hot',
        ingredients: ['Mexoryl', 'Avobenzone', 'Titanium Dioxide'],
        bestFor: ['Sun Protection', 'Dark Spots', 'Anti-Aging'],
        skinType: ['All Types', 'Sensitive'],
        pros: ['Lightweight', 'No White Cast', 'Sweat-Resistant'],
        cons: ['High Price'],
        usage: 'Every morning, reapply every 2 hours',
        description: 'Advanced sunscreen with broad-spectrum protection.',
        tags: ['sunscreen', 'spf', 'protection', 'sun']
    },
    {
        id: 'sk-005',
        name: 'Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        category: 'skincare',
        subcategory: 'Serum',
        emoji: '✨',
        price: 180,
        oldPrice: 230,
        rating: 4.5,
        reviewsCount: 325,
        stock: 120,
        badge: 'bestseller',
        ingredients: ['Niacinamide 10%', 'Zinc 1%'],
        bestFor: ['Enlarged Pores', 'Excess Oil', 'Acne Marks'],
        skinType: ['Oily', 'Combination'],
        pros: ['Cheap', 'Effective', 'Reduces Oil'],
        cons: ['May Irritate Some'],
        usage: 'Morning and evening',
        description: 'Reduces pore appearance and controls oil production.',
        tags: ['niacinamide', 'pores', 'oil', 'acne']
    },
    {
        id: 'sk-006',
        name: 'Rose Water Toner',
        brand: 'Nature Republic',
        category: 'skincare',
        subcategory: 'Toner',
        emoji: '🌹',
        price: 140,
        oldPrice: 180,
        rating: 4.3,
        reviewsCount: 98,
        stock: 70,
        ingredients: ['Rose Water', 'Glycerin', 'Butylene Glycol'],
        bestFor: ['Gentle Cleansing', 'Refreshing', 'Sensitive Skin'],
        skinType: ['All Types'],
        pros: ['Very Gentle', 'Nice Scent', 'Cheap'],
        cons: ['Simple Results'],
        usage: 'After cleanser',
        description: 'Gentle rose water toner for all skin types.',
        tags: ['toner', 'rose water', 'refresh']
    },
    {
        id: 'sk-007',
        name: 'Retinol 0.5% in Squalane',
        brand: 'The Ordinary',
        category: 'skincare',
        subcategory: 'Serum',
        emoji: '🌙',
        price: 280,
        oldPrice: 350,
        rating: 4.6,
        reviewsCount: 156,
        stock: 45,
        badge: 'hot',
        ingredients: ['Retinol 0.5%', 'Squalane'],
        bestFor: ['Wrinkles', 'Exfoliation', 'Cell Renewal'],
        skinType: ['Normal', 'Oily', 'Combination'],
        pros: ['Effective for Wrinkles', 'Improves Texture'],
        cons: ['Causes Peeling', 'Not for Pregnancy'],
        usage: 'Evening, twice weekly initially',
        description: 'Anti-aging retinol serum for smoother, younger-looking skin.',
        tags: ['retinol', 'anti-aging', 'wrinkles']
    },
    {
        id: 'sk-008',
        name: 'Dead Sea Mud Mask',
        brand: 'Freeman',
        category: 'skincare',
        subcategory: 'Mask',
        emoji: '🏖️',
        price: 110,
        oldPrice: 150,
        rating: 4.4,
        reviewsCount: 87,
        stock: 90,
        ingredients: ['Dead Sea Mud', 'Aloe Vera', 'Green Tea'],
        bestFor: ['Pore Cleansing', 'Oil Control', 'Acne'],
        skinType: ['Oily', 'Combination'],
        pros: ['Deep Cleansing', 'Cheap'],
        cons: ['Dries Skin'],
        usage: '1-2 times weekly',
        description: 'Purifying mud mask that draws out impurities.',
        tags: ['mask', 'clay', 'mud', 'purifying']
    },
    {
        id: 'sk-009',
        name: 'Caffeine Eye Cream',
        brand: 'The Ordinary',
        category: 'skincare',
        subcategory: 'Eye Cream',
        emoji: '👁️',
        price: 230,
        oldPrice: 290,
        rating: 4.2,
        reviewsCount: 76,
        stock: 55,
        ingredients: ['Caffeine 5%', 'EGCG'],
        bestFor: ['Dark Circles', 'Puffiness'],
        skinType: ['All Types'],
        pros: ['Reduces Puffiness', 'Lightweight'],
        cons: ['Slow Results'],
        usage: 'Morning and evening',
        description: 'Depuffing eye cream with caffeine.',
        tags: ['eye cream', 'caffeine', 'dark circles']
    },
    {
        id: 'sk-010',
        name: 'Hyaluronic Acid 2% + B5',
        brand: 'The Ordinary',
        category: 'skincare',
        subcategory: 'Serum',
        emoji: '💦',
        price: 200,
        oldPrice: 260,
        rating: 4.7,
        reviewsCount: 298,
        stock: 110,
        badge: 'bestseller',
        ingredients: ['Hyaluronic Acid', 'Vitamin B5'],
        bestFor: ['Deep Hydration', 'Skin Glow', 'Fine Lines'],
        skinType: ['All Types'],
        pros: ['Instant Hydration', 'Lightweight', 'Affordable'],
        cons: ['Needs Moisturizer After'],
        usage: 'On damp skin, morning and evening',
        description: 'Multi-depth hydrating serum for plumper skin.',
        tags: ['hyaluronic', 'hydration', 'serum']
    },
    {
        id: 'sk-011',
        name: 'Water-Based Foundation',
        brand: 'Maybelline',
        category: 'skincare',
        subcategory: 'Foundation',
        emoji: '💄',
        price: 340,
        oldPrice: 430,
        rating: 4.5,
        reviewsCount: 178,
        stock: 75,
        ingredients: ['Water', 'Silicone', 'Vitamin E'],
        bestFor: ['Natural Coverage', 'Oily Skin'],
        skinType: ['Oily', 'Combination'],
        pros: ['Lightweight', "Doesn't Clog Pores"],
        cons: ['Medium Coverage'],
        usage: 'Daily',
        description: 'Lightweight water-based foundation for natural look.',
        tags: ['foundation', 'water-based', 'lightweight']
    },
    {
        id: 'sk-012',
        name: 'Tea Tree Sheet Mask',
        brand: 'Innisfree',
        category: 'skincare',
        subcategory: 'Mask',
        emoji: '🍃',
        price: 70,
        oldPrice: 95,
        rating: 4.3,
        reviewsCount: 98,
        stock: 120,
        ingredients: ['Green Tea', 'Tea Tree'],
        bestFor: ['Acne', 'Soothing Skin'],
        skinType: ['Oily', 'Combination'],
        pros: ['Refreshing', 'Cheap'],
        cons: ['Temporary Result'],
        usage: '1-2 times weekly',
        description: 'Soothing sheet mask with tea tree for acne-prone skin.',
        tags: ['sheet mask', 'tea tree', 'soothing']
    },
    {
        id: 'sk-013',
        name: 'Retinoid Serum',
        brand: 'La Roche-Posay',
        category: 'skincare',
        subcategory: 'Serum',
        emoji: '🌛',
        price: 780,
        oldPrice: 950,
        rating: 4.8,
        reviewsCount: 143,
        stock: 35,
        badge: 'hot',
        ingredients: ['Retinoid', 'Niacinamide'],
        bestFor: ['Wrinkles', 'Dark Spots', 'Renewal'],
        skinType: ['All Types'],
        pros: ['Effective', 'Gentle'],
        cons: ['Expensive'],
        usage: 'Evening, 2-3 times weekly',
        description: 'Advanced retinoid serum for anti-aging.',
        tags: ['retinoid', 'anti-aging', 'serum']
    },
    {
        id: 'sk-014',
        name: 'Lip Balm',
        brand: 'Vaseline',
        category: 'skincare',
        subcategory: 'Lip Care',
        emoji: '💋',
        price: 45,
        oldPrice: 60,
        rating: 4.6,
        reviewsCount: 423,
        stock: 200,
        badge: 'bestseller',
        ingredients: ['Petrolatum', 'Vaseline'],
        bestFor: ['Chapped Lips', 'Hydration'],
        skinType: ['All Types'],
        pros: ['Cheap', 'Effective'],
        cons: ['Needs Reapplication'],
        usage: 'As needed',
        description: 'Classic lip balm for soft, hydrated lips.',
        tags: ['lip balm', 'hydration', 'lips']
    },
    {
        id: 'sk-015',
        name: 'Night Cream',
        brand: 'Olay',
        category: 'skincare',
        subcategory: 'Moisturizer',
        emoji: '🌜',
        price: 590,
        oldPrice: 740,
        rating: 4.4,
        reviewsCount: 134,
        stock: 50,
        ingredients: ['Niacinamide', 'Peptides', 'Vitamin E'],
        bestFor: ['Night Nutrition', 'Renewal'],
        skinType: ['Normal', 'Dry'],
        pros: ['Rich', 'Repairs Skin'],
        cons: ['High Price'],
        usage: 'Before bed',
        description: 'Rich night cream that works while you sleep.',
        tags: ['night cream', 'anti-aging']
    },
    {
        id: 'sk-016',
        name: 'Micellar Water',
        brand: 'Garnier',
        category: 'skincare',
        subcategory: 'Cleanser',
        emoji: '💧',
        price: 150,
        oldPrice: 190,
        rating: 4.7,
        reviewsCount: 356,
        stock: 150,
        badge: 'bestseller',
        ingredients: ['Water', 'Micelles', 'Glycerin'],
        bestFor: ['Makeup Removal', 'Quick Cleanse'],
        skinType: ['All Types', 'Sensitive'],
        pros: ['Easy to Use', 'Gentle'],
        cons: ['Not for Waterproof Makeup'],
        usage: 'As needed',
        description: 'Gentle micellar water for makeup removal.',
        tags: ['micellar', 'cleanser', 'makeup remover']
    },
    {
        id: 'sk-017',
        name: 'Vitamin C + E Serum',
        brand: 'Timeless',
        category: 'skincare',
        subcategory: 'Serum',
        emoji: '🍋',
        price: 420,
        oldPrice: 520,
        rating: 4.6,
        reviewsCount: 145,
        stock: 40,
        badge: 'hot',
        ingredients: ['Vitamin C 20%', 'Vitamin E', 'Ferulic Acid'],
        bestFor: ['Glow', 'Pigmentation'],
        skinType: ['Normal', 'Oily', 'Combination'],
        pros: ['Effective', 'Antioxidant'],
        cons: ['Oxidizes'],
        usage: 'Morning',
        description: 'Powerful antioxidant serum for radiant skin.',
        tags: ['vitamin c', 'antioxidant', 'glow']
    },
    {
        id: 'sk-018',
        name: 'BB Cream',
        brand: "L'Oréal",
        category: 'skincare',
        subcategory: 'Foundation',
        emoji: '🧴',
        price: 380,
        oldPrice: 480,
        rating: 4.3,
        reviewsCount: 112,
        stock: 65,
        ingredients: ['Water', 'SPF 20', 'Vitamin E'],
        bestFor: ['Light Coverage', 'Daily Use'],
        skinType: ['All Types'],
        pros: ['Light', 'Has Sunscreen'],
        cons: ['Light Coverage'],
        usage: 'Daily',
        description: 'All-in-one BB cream with SPF protection.',
        tags: ['bb cream', 'light coverage']
    },
    {
        id: 'sk-019',
        name: 'Avocado Sheet Mask',
        brand: 'The Face Shop',
        category: 'skincare',
        subcategory: 'Mask',
        emoji: '🥑',
        price: 85,
        oldPrice: 110,
        rating: 4.4,
        reviewsCount: 76,
        stock: 110,
        ingredients: ['Avocado', 'Hyaluronic', 'Shea'],
        bestFor: ['Deep Hydration', 'Dry Skin'],
        skinType: ['Dry', 'Normal'],
        pros: ['Strong Hydration', 'Refreshing'],
        cons: ['Temporary'],
        usage: '1-2 times weekly',
        description: 'Nourishing avocado sheet mask for dry skin.',
        tags: ['sheet mask', 'avocado', 'hydration']
    },
    {
        id: 'sk-020',
        name: 'Hydrating Foundation',
        brand: 'NARS',
        category: 'skincare',
        subcategory: 'Foundation',
        emoji: '💧',
        price: 1400,
        oldPrice: 1700,
        rating: 4.7,
        reviewsCount: 156,
        stock: 30,
        badge: 'hot',
        ingredients: ['Water', 'Glycerin', 'Vitamin E'],
        bestFor: ['Dry Skin', 'Glow'],
        skinType: ['Dry', 'Normal'],
        pros: ['Hydrating', 'Natural Glow'],
        cons: ['Very Expensive'],
        usage: 'Daily',
        description: 'Luxurious hydrating foundation with skincare benefits.',
        tags: ['foundation', 'hydrating', 'luxury']
    },

    // ============ MAKEUP (10) ============
    {
        id: 'mk-001',
        name: 'Volume & Length Mascara',
        brand: 'Maybelline',
        category: 'makeup',
        subcategory: 'Mascara',
        emoji: '👁️',
        price: 280,
        oldPrice: 350,
        rating: 4.7,
        reviewsCount: 456,
        stock: 120,
        badge: 'bestseller',
        ingredients: ['Wax', 'Polymers', 'Fibers'],
        bestFor: ['Volume', 'Length', 'Evening Look'],
        skinType: ['All Types'],
        pros: ['Big Volume', 'No Clumps'],
        cons: ['Hard to Remove'],
        usage: 'After eyeliner',
        description: 'Dramatic volume and length mascara.',
        tags: ['mascara', 'volume', 'lashes']
    },
    {
        id: 'mk-002',
        name: 'Matte Lipstick',
        brand: 'MAC',
        category: 'makeup',
        subcategory: 'Lipstick',
        emoji: '💋',
        price: 950,
        oldPrice: 1200,
        rating: 4.8,
        reviewsCount: 678,
        stock: 80,
        badge: 'bestseller',
        ingredients: ['Wax', 'Oils', 'Pigments'],
        bestFor: ['Events', 'Bold Color'],
        skinType: ['All Types'],
        pros: ['Long-Lasting', 'Color Payoff'],
        cons: ['Drying', 'Expensive'],
        usage: 'After lip liner',
        description: 'Iconic matte lipstick with intense color.',
        tags: ['lipstick', 'matte', 'mac']
    },
    {
        id: 'mk-003',
        name: 'Liquid Eyeliner',
        brand: 'Essence',
        category: 'makeup',
        subcategory: 'Eyeliner',
        emoji: '🖊️',
        price: 120,
        oldPrice: 160,
        rating: 4.5,
        reviewsCount: 234,
        stock: 150,
        ingredients: ['Water', 'Pigments', 'Polymers'],
        bestFor: ['Precise Lines', 'Drawing'],
        skinType: ['All Types'],
        pros: ['Cheap', 'Long-Lasting', 'No Smudge'],
        cons: ['Needs Steady Hand'],
        usage: 'On eyelid',
        description: 'Precise liquid eyeliner for sharp looks.',
        tags: ['eyeliner', 'liquid', 'black']
    },
    {
        id: 'mk-004',
        name: 'Powder Blush',
        brand: 'NYX',
        category: 'makeup',
        subcategory: 'Blush',
        emoji: '🌸',
        price: 320,
        oldPrice: 400,
        rating: 4.6,
        reviewsCount: 189,
        stock: 90,
        ingredients: ['Powder', 'Pigments', 'Vitamin E'],
        bestFor: ['Natural Color', 'Daily Look'],
        skinType: ['Oily', 'Combination'],
        pros: ['Long-Lasting', 'Easy to Blend'],
        cons: ['May Look Heavy'],
        usage: 'On cheeks',
        description: 'Silky powder blush for a natural flush.',
        tags: ['blush', 'powder', 'cheeks']
    },
    {
        id: 'mk-005',
        name: 'Nude Eyeshadow Palette',
        brand: 'Huda Beauty',
        category: 'makeup',
        subcategory: 'Eyeshadow',
        emoji: '🎨',
        price: 1150,
        oldPrice: 1450,
        rating: 4.8,
        reviewsCount: 567,
        stock: 45,
        badge: 'bestseller',
        ingredients: ['Powder', 'Pigments', 'Shimmer'],
        bestFor: ['Nude Look', 'Events'],
        skinType: ['All Types'],
        pros: ['Beautiful Colors', 'Easy to Blend'],
        cons: ['Expensive'],
        usage: 'With soft brush',
        description: 'Stunning nude palette with matte and shimmer shades.',
        tags: ['eyeshadow', 'nude', 'palette']
    },
    {
        id: 'mk-006',
        name: 'High Coverage Concealer',
        brand: 'Tarte',
        category: 'makeup',
        subcategory: 'Concealer',
        emoji: '🖌️',
        price: 980,
        oldPrice: 1250,
        rating: 4.7,
        reviewsCount: 456,
        stock: 55,
        badge: 'bestseller',
        ingredients: ['Water', 'Silicone', 'Vitamin E'],
        bestFor: ['Dark Circles', 'Acne', 'Blemishes'],
        skinType: ['All Types'],
        pros: ['Amazing Coverage', 'Long-Lasting'],
        cons: ['Expensive'],
        usage: 'After foundation',
        description: 'Full coverage concealer for flawless skin.',
        tags: ['concealer', 'coverage', 'tarte']
    },
    {
        id: 'mk-007',
        name: 'Lip Liner',
        brand: 'NYX',
        category: 'makeup',
        subcategory: 'Lip Liner',
        emoji: '✏️',
        price: 140,
        oldPrice: 180,
        rating: 4.5,
        reviewsCount: 178,
        stock: 140,
        ingredients: ['Wax', 'Oils', 'Pigments'],
        bestFor: ['Lip Definition', 'Lipstick Base'],
        skinType: ['All Types'],
        pros: ['Cheap', 'Long-Lasting'],
        cons: ['Needs Sharpening'],
        usage: 'Before lipstick',
        description: 'Precise lip liner for defined lips.',
        tags: ['lip liner', 'nyx', 'definition']
    },
    {
        id: 'mk-008',
        name: 'Setting Spray',
        brand: 'MAC',
        category: 'makeup',
        subcategory: 'Setting Spray',
        emoji: '💦',
        price: 850,
        oldPrice: 1050,
        rating: 4.6,
        reviewsCount: 234,
        stock: 60,
        ingredients: ['Water', 'Polymers', 'Vitamin E'],
        bestFor: ['Makeup Setting', 'Long Events'],
        skinType: ['All Types'],
        pros: ['Sets Makeup', 'Refreshing'],
        cons: ['Expensive'],
        usage: 'After makeup',
        description: 'Locks makeup in place all day.',
        tags: ['setting spray', 'mac']
    },
    {
        id: 'mk-009',
        name: 'Liquid Lipstick',
        brand: 'Kylie Cosmetics',
        category: 'makeup',
        subcategory: 'Lipstick',
        emoji: '💧',
        price: 600,
        oldPrice: 780,
        rating: 4.4,
        reviewsCount: 345,
        stock: 75,
        ingredients: ['Water', 'Pigments', 'Polymers'],
        bestFor: ['Long Wear', 'Bold Look'],
        skinType: ['All Types'],
        pros: ['Very Long-Lasting', 'Lightweight'],
        cons: ['Drying'],
        usage: 'One coat',
        description: 'Long-wear liquid lipstick.',
        tags: ['liquid lipstick', 'kylie']
    },
    {
        id: 'mk-010',
        name: 'Matte Liquid Foundation',
        brand: 'Maybelline',
        category: 'makeup',
        subcategory: 'Foundation',
        emoji: '🧴',
        price: 380,
        oldPrice: 480,
        rating: 4.5,
        reviewsCount: 267,
        stock: 100,
        badge: 'bestseller',
        ingredients: ['Water', 'Silicone', 'Vitamin E'],
        bestFor: ['Oily Skin', 'Full Coverage'],
        skinType: ['Oily', 'Combination'],
        pros: ['Good Coverage', 'Long-Lasting'],
        cons: ['May Dry Out Skin'],
        usage: 'Daily',
        description: 'Matte foundation for oily skin.',
        tags: ['foundation', 'matte', 'maybelline']
    },

    // ============ HAIR CARE (10) ============
    {
        id: 'hr-001',
        name: 'Sulfate-Free Shampoo',
        brand: 'OGX',
        category: 'hair',
        subcategory: 'Shampoo',
        emoji: '🧴',
        price: 300,
        oldPrice: 380,
        rating: 4.5,
        reviewsCount: 234,
        stock: 80,
        badge: 'bestseller',
        ingredients: ['Water', 'Gentle Surfactant', 'Oils'],
        bestFor: ['Colored Hair', 'Dry Hair'],
        skinType: ['All Types'],
        pros: ['Gentle', "Doesn't Strip Hair"],
        cons: ['Less Foam'],
        usage: 'Twice weekly',
        description: 'Gentle sulfate-free shampoo for colored hair.',
        tags: ['shampoo', 'sulfate-free', 'ogx']
    },
    {
        id: 'hr-002',
        name: 'Moisturizing Conditioner',
        brand: 'Pantene',
        category: 'hair',
        subcategory: 'Conditioner',
        emoji: '💧',
        price: 140,
        oldPrice: 190,
        rating: 4.3,
        reviewsCount: 345,
        stock: 120,
        ingredients: ['Water', 'Glycerin', 'Oils'],
        bestFor: ['Hydration', 'Detangling'],
        skinType: ['All Types'],
        pros: ['Cheap', 'Effective'],
        cons: ['May Weigh Down Fine Hair'],
        usage: 'After shampoo',
        description: 'Moisturizing conditioner for soft, manageable hair.',
        tags: ['conditioner', 'moisturizing', 'pantene']
    },
    {
        id: 'hr-003',
        name: 'Coconut Oil',
        brand: 'Parachute',
        category: 'hair',
        subcategory: 'Hair Oil',
        emoji: '🥥',
        price: 120,
        oldPrice: 160,
        rating: 4.6,
        reviewsCount: 567,
        stock: 150,
        badge: 'bestseller',
        ingredients: ['Pure Coconut Oil'],
        bestFor: ['Deep Hydration', 'Hair Nutrition'],
        skinType: ['Dry', 'Normal'],
        pros: ['Natural', 'Cheap', 'Effective'],
        cons: ['May Weigh Down Fine Hair'],
        usage: 'One hour before shampoo',
        description: 'Pure coconut oil for deep hair nourishment.',
        tags: ['coconut oil', 'hair oil', 'natural']
    },
    {
        id: 'hr-004',
        name: 'Protein Hair Mask',
        brand: 'Shea Moisture',
        category: 'hair',
        subcategory: 'Hair Mask',
        emoji: '💪',
        price: 520,
        oldPrice: 650,
        rating: 4.7,
        reviewsCount: 178,
        stock: 60,
        badge: 'hot',
        ingredients: ['Protein', 'Oils', 'Shea Butter'],
        bestFor: ['Damaged Hair', 'Breakage'],
        skinType: ['Damaged', 'Dry'],
        pros: ['Strengthens Hair', 'Repairs Damage'],
        cons: ['Expensive'],
        usage: 'Once weekly',
        description: 'Intensive protein mask for damaged hair.',
        tags: ['hair mask', 'protein', 'shea']
    },
    {
        id: 'hr-005',
        name: 'Anti-Breakage Serum',
        brand: "L'Oréal",
        category: 'hair',
        subcategory: 'Hair Serum',
        emoji: '✨',
        price: 320,
        oldPrice: 420,
        rating: 4.5,
        reviewsCount: 189,
        stock: 90,
        ingredients: ['Silicone', 'Oils', 'Vitamin E'],
        bestFor: ['Breakage', 'Shine'],
        skinType: ['All Types'],
        pros: ['Instant Shine', 'Protects'],
        cons: ['Needs Washing'],
        usage: 'On ends',
        description: 'Anti-breakage serum for healthy-looking hair.',
        tags: ['hair serum', 'anti-breakage']
    },
    {
        id: 'hr-006',
        name: 'Anti-Dandruff Shampoo',
        brand: 'Head & Shoulders',
        category: 'hair',
        subcategory: 'Shampoo',
        emoji: '❄️',
        price: 160,
        oldPrice: 210,
        rating: 4.4,
        reviewsCount: 456,
        stock: 200,
        ingredients: ['Zinc Pyrithione', 'Water', 'Surfactant'],
        bestFor: ['Dandruff', 'Itchy Scalp'],
        skinType: ['Oily'],
        pros: ['Effective', 'Cheap'],
        cons: ['May Dry Hair'],
        usage: '2-3 times weekly',
        description: 'Powerful anti-dandruff shampoo.',
        tags: ['shampoo', 'dandruff', 'head shoulders']
    },
    {
        id: 'hr-007',
        name: 'Moroccan Argan Oil',
        brand: 'OGX',
        category: 'hair',
        subcategory: 'Hair Oil',
        emoji: '🌰',
        price: 350,
        oldPrice: 450,
        rating: 4.7,
        reviewsCount: 278,
        stock: 75,
        badge: 'hot',
        ingredients: ['Argan Oil', 'Vitamin E'],
        bestFor: ['Nutrition', 'Shine'],
        skinType: ['All Types'],
        pros: ['Natural Shine', 'Lightweight'],
        cons: ['Expensive'],
        usage: 'On damp hair',
        description: 'Luxurious argan oil for silky hair.',
        tags: ['argan oil', 'moroccan', 'shine']
    },
    {
        id: 'hr-008',
        name: 'Heat Protectant Spray',
        brand: 'TRESemmé',
        category: 'hair',
        subcategory: 'Spray',
        emoji: '🔥',
        price: 250,
        oldPrice: 320,
        rating: 4.6,
        reviewsCount: 198,
        stock: 100,
        ingredients: ['Silicone', 'Polymers', 'Vitamin E'],
        bestFor: ['Heat Protection', 'Blow Dry'],
        skinType: ['All Types'],
        pros: ['Protects to 230°C', 'Lightweight'],
        cons: ['Needs Reapplication'],
        usage: 'Before styling',
        description: 'Protects hair from heat damage.',
        tags: ['heat protectant', 'spray']
    },
    {
        id: 'hr-009',
        name: 'Deep Repair Conditioner',
        brand: 'Kérastase',
        category: 'hair',
        subcategory: 'Conditioner',
        emoji: '💎',
        price: 1100,
        oldPrice: 1400,
        rating: 4.8,
        reviewsCount: 234,
        stock: 35,
        badge: 'bestseller',
        ingredients: ['Protein', 'Oils', 'Vitamin E'],
        bestFor: ['Damaged Hair', 'Breakage'],
        skinType: ['Damaged', 'Dry'],
        pros: ['Instant Results', 'Deep Repair'],
        cons: ['Very Expensive'],
        usage: 'After shampoo',
        description: 'Professional deep repair conditioner.',
        tags: ['conditioner', 'kerastase', 'luxury']
    },
    {
        id: 'hr-010',
        name: 'Color-Protect Shampoo',
        brand: 'Redken',
        category: 'hair',
        subcategory: 'Shampoo',
        emoji: '🎨',
        price: 890,
        oldPrice: 1150,
        rating: 4.7,
        reviewsCount: 167,
        stock: 45,
        ingredients: ['Gentle Surfactant', 'Vitamin E', 'Oils'],
        bestFor: ['Colored Hair', 'Color Lasting'],
        skinType: ['Colored'],
        pros: ['Maintains Color', 'Gentle'],
        cons: ['Expensive'],
        usage: '2-3 times weekly',
        description: 'Color-protecting shampoo for dyed hair.',
        tags: ['shampoo', 'color', 'redken']
    },

    // ============ NAILS (5) ============
    {
        id: 'nl-001',
        name: 'Gel Nail Polish',
        brand: 'Essie',
        category: 'nails',
        subcategory: 'Nail Polish',
        emoji: '💅',
        price: 280,
        oldPrice: 350,
        rating: 4.6,
        reviewsCount: 234,
        stock: 100,
        badge: 'bestseller',
        ingredients: ['Resin', 'Pigments', 'Solvent'],
        bestFor: ['Long Wear', 'Shine'],
        skinType: ['All Types'],
        pros: ['Lasts 2 Weeks', 'Strong Shine'],
        cons: ['Needs Special Remover'],
        usage: 'On clean nails',
        description: 'Long-lasting gel nail polish.',
        tags: ['nail polish', 'gel', 'essie']
    },
    {
        id: 'nl-002',
        name: 'Nail Polish Remover',
        brand: 'Cutex',
        category: 'nails',
        subcategory: 'Remover',
        emoji: '🧴',
        price: 60,
        oldPrice: 90,
        rating: 4.4,
        reviewsCount: 567,
        stock: 250,
        ingredients: ['Acetone', 'Water', 'Oils'],
        bestFor: ['Polish Removal', 'Cleaning'],
        skinType: ['All Types'],
        pros: ['Cheap', 'Effective'],
        cons: ['May Dry Nails'],
        usage: 'As needed',
        description: 'Quick nail polish remover.',
        tags: ['remover', 'cutex', 'nails']
    },
    {
        id: 'nl-003',
        name: 'Cuticle Oil',
        brand: 'CND',
        category: 'nails',
        subcategory: 'Nail Care',
        emoji: '🌿',
        price: 520,
        oldPrice: 650,
        rating: 4.7,
        reviewsCount: 178,
        stock: 60,
        badge: 'hot',
        ingredients: ['Natural Oils', 'Vitamin E'],
        bestFor: ['Nail Hydration', 'Cuticle Care'],
        skinType: ['All Types'],
        pros: ['Deep Hydration', 'Nice Scent'],
        cons: ['Expensive'],
        usage: 'Daily',
        description: 'Nourishing cuticle oil for healthy nails.',
        tags: ['cuticle oil', 'cnd', 'nails']
    },
    {
        id: 'nl-004',
        name: 'Nail Strengthener',
        brand: 'Sally Hansen',
        category: 'nails',
        subcategory: 'Nail Care',
        emoji: '💪',
        price: 200,
        oldPrice: 260,
        rating: 4.5,
        reviewsCount: 289,
        stock: 120,
        ingredients: ['Calcium', 'Protein', 'Vitamin E'],
        bestFor: ['Weak Nails', 'Breakage'],
        skinType: ['All Types'],
        pros: ['Strengthens Nails', 'Cheap'],
        cons: ['Slow Results'],
        usage: 'Daily',
        description: 'Strengthens weak, brittle nails.',
        tags: ['nail strengthener', 'sally hansen']
    },
    {
        id: 'nl-005',
        name: 'Matte Nail Polish',
        brand: 'OPI',
        category: 'nails',
        subcategory: 'Nail Polish',
        emoji: '🖤',
        price: 520,
        oldPrice: 680,
        rating: 4.6,
        reviewsCount: 198,
        stock: 75,
        badge: 'hot',
        ingredients: ['Resin', 'Pigments', 'Solvent'],
        bestFor: ['Modern Look', 'Events'],
        skinType: ['All Types'],
        pros: ['Trendy Look', 'Long-Lasting'],
        cons: ['Expensive'],
        usage: 'On clean nails',
        description: 'Trendy matte finish nail polish.',
        tags: ['nail polish', 'matte', 'opi']
    },

    // ============ PERFUMES (3) ============
    {
        id: 'pf-001',
        name: 'Floral Luxury Perfume',
        brand: 'Dior',
        category: 'perfumes',
        subcategory: 'Women Perfume',
        emoji: '🌸',
        price: 2800,
        oldPrice: 3500,
        rating: 4.8,
        reviewsCount: 456,
        stock: 30,
        badge: 'bestseller',
        ingredients: ['Rose', 'Jasmine', 'Vanilla'],
        bestFor: ['Events', 'Romantic Look'],
        skinType: ['All Types'],
        pros: ['Strong Longevity', 'Elegant Scent'],
        cons: ['Very Expensive'],
        usage: 'On pulse points',
        description: 'Elegant floral perfume for special occasions.',
        tags: ['perfume', 'floral', 'dior']
    },
    {
        id: 'pf-002',
        name: 'Oriental Luxury Perfume',
        brand: 'Yves Saint Laurent',
        category: 'perfumes',
        subcategory: 'Women Perfume',
        emoji: '🌙',
        price: 3200,
        oldPrice: 4000,
        rating: 4.9,
        reviewsCount: 567,
        stock: 25,
        badge: 'bestseller',
        ingredients: ['Oud', 'Musk', 'Vanilla'],
        bestFor: ['Events', 'Winter'],
        skinType: ['All Types'],
        pros: ['Excellent Longevity', 'Luxury Scent'],
        cons: ['Very Expensive'],
        usage: 'On pulse points',
        description: 'Luxurious oriental perfume.',
        tags: ['perfume', 'oriental', 'ysl']
    },
    {
        id: 'pf-003',
        name: 'Fruity Fresh Perfume',
        brand: 'Escada',
        category: 'perfumes',
        subcategory: 'Women Perfume',
        emoji: '🍓',
        price: 1450,
        oldPrice: 1850,
        rating: 4.5,
        reviewsCount: 289,
        stock: 50,
        ingredients: ['Strawberry', 'Peach', 'Vanilla'],
        bestFor: ['Summer', 'Daily Use'],
        skinType: ['All Types'],
        pros: ['Refreshing', 'Light'],
        cons: ['Medium Longevity'],
        usage: 'Daily',
        description: 'Fresh fruity perfume for summer days.',
        tags: ['perfume', 'fruity', 'escada']
    },

    // ============ BODY CARE (2) ============
    {
        id: 'bd-001',
        name: 'Moisturizing Body Wash',
        brand: 'Dove',
        category: 'bodycare',
        subcategory: 'Body Wash',
        emoji: '🧼',
        price: 140,
        oldPrice: 190,
        rating: 4.5,
        reviewsCount: 567,
        stock: 180,
        badge: 'bestseller',
        ingredients: ['Water', 'Glycerin', 'Oils'],
        bestFor: ['Hydration', 'Dry Skin'],
        skinType: ['Dry', 'Normal'],
        pros: ['Gentle', 'Cheap'],
        cons: ['Not for Oily Skin'],
        usage: 'Daily',
        description: 'Gentle moisturizing body wash.',
        tags: ['body wash', 'dove', 'hydration']
    },
    {
        id: 'bd-002',
        name: 'Body Lotion',
        brand: 'Nivea',
        category: 'bodycare',
        subcategory: 'Body Lotion',
        emoji: '🧴',
        price: 120,
        oldPrice: 160,
        rating: 4.4,
        reviewsCount: 678,
        stock: 220,
        ingredients: ['Water', 'Glycerin', 'Shea Butter'],
        bestFor: ['Daily Hydration', 'Dry Skin'],
        skinType: ['Dry', 'Normal'],
        pros: ['Cheap', 'Effective'],
        cons: ['Needs Reapplication'],
        usage: 'After shower',
        description: 'Classic moisturizing body lotion.',
        tags: ['body lotion', 'nivea', 'hydration']
    },
    {
        // Canonical Restore-Test review E2E product.
        id: '21d977a0-111b-4bb4-9736-0f2994294d48',
        name: 'Test Vitamin C Serum',
        brand: 'Velora E2E',
        category: 'skincare',
        subcategory: 'Serum',
        emoji: '🧪',
        price: 250,
        oldPrice: null,
        rating: 0,
        reviewsCount: 0,
        stock: 23,
        ingredients: [],
        bestFor: [],
        skinType: [],
        pros: [],
        cons: [],
        usage: '',
        description: 'Restore-Test product used for the Reviews E2E flow.',
        tags: ['e2e review product', 'review', 'test vitamin c serum']
    }

];

/* ============ CATEGORIES ============ */
const CATEGORIES = [
    { id: 'skincare', name: 'Skincare', icon: '🧴', count: 20 },
    { id: 'makeup', name: 'Makeup', icon: '💄', count: 10 },
    { id: 'hair', name: 'Hair Care', icon: '💇‍♀️', count: 10 },
    { id: 'nails', name: 'Nails', icon: '💅', count: 5 },
    { id: 'perfumes', name: 'Perfumes', icon: '🌸', count: 3 },
    { id: 'bodycare', name: 'Body Care', icon: '🧼', count: 2 }
];

/* ============ GUIDE ARTICLES ============ */
const GUIDE_ARTICLES = [
    {
        id: 'guide-skin-types',
        title: 'How to Know Your Skin Type in 3 Steps',
        category: 'skincare',
        categoryLabel: '🧴 Skincare',
        emoji: '🧴',
        readTime: 4,
        excerpt: 'A simple home test to determine your skin type: oily, dry, combination, or sensitive.',
        content: 
            '<h2>🧴 Skin Type Test</h2>' +
            '<p>Knowing your skin type is the first step to choosing the right routine. Try this simple test:</p>' +
            '<h3>Step 1: Wash Your Face</h3>' +
            '<p>Wash with a gentle cleanser and lukewarm water, then pat dry. Do not apply any products.</p>' +
            '<h3>Step 2: Wait One Hour</h3>' +
            '<p>Wait 60 minutes without touching your face. Your skin will return to its natural state.</p>' +
            '<h3>Step 3: Observe</h3>' +
            '<ul>' +
            '<li><strong>Shiny all over:</strong> Oily skin → Use oil-free products</li>' +
            '<li><strong>Tight and dry:</strong> Dry skin → Use rich moisturizers</li>' +
            '<li><strong>Shiny only in T-zone:</strong> Combination skin → Use dual routine</li>' +
            '<li><strong>Redness and itching:</strong> Sensitive skin → Use gentle products</li>' +
            '<li><strong>Balanced, no issues:</strong> Normal skin → Simple routine works</li>' +
            '</ul>' +
            '<h3>💡 Important Tip</h3>' +
            '<p>Skin type can change with season and age. Retest every 3 months.</p>'
    },
    {
        id: 'guide-hair-porosity',
        title: 'Hair Porosity Test with Water',
        category: 'hair',
        categoryLabel: '💇‍♀️ Hair Care',
        emoji: '💇‍♀️',
        readTime: 5,
        excerpt: 'Hair porosity determines the right products for you. A simple water test reveals everything.',
        content: 
            '<h2>💇‍♀️ Hair Porosity Test</h2>' +
            '<p>Hair porosity is the ability of your hair to absorb and retain moisture.</p>' +
            '<h3>🧪 The Test</h3>' +
            '<ol>' +
            '<li>Take a clean strand of hair</li>' +
            '<li>Place it in a glass of lukewarm water</li>' +
            '<li>Wait 2-4 minutes</li>' +
            '<li>Observe its position</li>' +
            '</ol>' +
            '<h3>📊 Results</h3>' +
            '<ul>' +
            '<li><strong>Floats on top:</strong> Low porosity</li>' +
            '<li><strong>Middle of glass:</strong> Medium porosity (best)</li>' +
            '<li><strong>Sinks to bottom:</strong> High porosity</li>' +
            '</ul>' +
            '<h3>💡 Tips</h3>' +
            '<p><strong>Low:</strong> Use light products + heat to open cuticles</p>' +
            '<p><strong>Medium:</strong> Normal routine with moisture and protein</p>' +
            '<p><strong>High:</strong> Multiple layers of moisture + protein + heavy oils</p>'
    },
    {
        id: 'guide-routine',
        title: 'Morning vs Evening Skincare Routine',
        category: 'skincare',
        categoryLabel: '🧴 Skincare',
        emoji: '☀️',
        readTime: 6,
        excerpt: 'The difference between routines and what each should include.',
        content: 
            '<h2>☀️ Morning Routine</h2>' +
            '<p>Goal: Protection from external factors</p>' +
            '<ol>' +
            '<li>Gentle cleanser</li>' +
            '<li>Toner (optional)</li>' +
            '<li>Vitamin C serum</li>' +
            '<li>Light moisturizer</li>' +
            '<li>Sunscreen SPF 30+ (most important!)</li>' +
            '</ol>' +
            '<h2>🌙 Evening Routine</h2>' +
            '<p>Goal: Remove pollution + cell renewal</p>' +
            '<ol>' +
            '<li>Makeup removal</li>' +
            '<li>Face cleanser</li>' +
            '<li>Toner (optional)</li>' +
            '<li>Treatment serum (retinol/niacinamide)</li>' +
            '<li>Eye cream</li>' +
            '<li>Rich moisturizer</li>' +
            '</ol>'
    },
    {
        id: 'guide-treatments',
        title: 'Protein vs Keratin vs Acid',
        category: 'hair',
        categoryLabel: '💇‍♀️ Hair Care',
        emoji: '💎',
        readTime: 5,
        excerpt: 'Three popular treatments. When do you need each one.',
        content: 
            '<h2>💎 The Difference</h2>' +
            '<h3>🧪 Protein</h3>' +
            '<p>Rebuilds hair from inside. For: Damaged hair. Duration: 4-6 weeks. ⚠️ Overuse causes brittleness.</p>' +
            '<h3>💫 Keratin</h3>' +
            '<p>Rebuilds outer layer. For: Curly hair. Duration: 3-6 months.</p>' +
            '<h3>⚗️ Acid Treatment</h3>' +
            '<p>Restores pH balance. Safe for regular use.</p>'
    },
    {
        id: 'guide-ingredients',
        title: '5 Active Ingredients You Must Know',
        category: 'skincare',
        categoryLabel: '🧴 Skincare',
        emoji: '🧪',
        readTime: 7,
        excerpt: 'Hyaluronic Acid, Niacinamide, Retinol, Vitamin C, and Ceramides.',
        content: 
            '<h2>🧪 5 Magic Ingredients</h2>' +
            '<h3>1️⃣ Hyaluronic Acid</h3>' +
            '<p>Deep hydration. Concentration: 1-2%</p>' +
            '<h3>2️⃣ Niacinamide</h3>' +
            '<p>Brightening + pore reduction. Concentration: 5-10%</p>' +
            '<h3>3️⃣ Retinol</h3>' +
            '<p>Cell renewal + anti-aging. Evening only</p>' +
            '<h3>4️⃣ Vitamin C</h3>' +
            '<p>Glow + pigmentation. Concentration: 10-20%</p>' +
            '<h3>5️⃣ Ceramides</h3>' +
            '<p>Strengthen skin barrier. Safe for everyone</p>'
    },
    {
        id: 'guide-oils',
        title: 'Natural Hair Oils Guide',
        category: 'hair',
        categoryLabel: '💇‍♀️ Hair Care',
        emoji: '🌿',
        readTime: 6,
        excerpt: 'Coconut, Argan, Castor, Jojoba, and Almond. Which oil suits your hair.',
        content: 
            '<h2>🌿 Oils Guide</h2>' +
            '<h3>🥥 Coconut Oil</h3>' +
            '<p>Best for damaged hair. Penetrates hair shaft</p>' +
            '<h3>🌰 Argan Oil</h3>' +
            '<p>For all hair types. Rich in vitamin E</p>' +
            '<h3>🌱 Castor Oil</h3>' +
            '<p>For hair growth. Heavy — mix with lighter oil</p>' +
            '<h3>💧 Jojoba Oil</h3>' +
            '<p>For oily hair. Very light</p>' +
            '<h3>🌰 Almond Oil</h3>' +
            '<p>Gentle — suitable for children</p>'
    }
];

/* ============ BLOG ARTICLES ============ */
const BLOG_ARTICLES = [
    {
        id: 'blog-morning-routine',
        title: 'The Perfect Morning Routine',
        category: 'skincare',
        categoryLabel: '☀️ Skincare',
        emoji: '☀️',
        author: 'Velora Team',
        readTime: 5,
        date: Date.now() - (2 * 24 * 60 * 60 * 1000),
        excerpt: 'Step-by-step guide to a protective morning routine.',
        content: 
            '<h2>☀️ The Perfect Routine</h2>' +
            '<p>The morning routine goal is <strong>protection</strong>.</p>' +
            '<h3>Step 1: Gentle Cleanser</h3>' +
            '<p>Gentle, sulfate-free cleanser</p>' +
            '<h3>Step 2: Toner</h3>' +
            '<p>Hydrating toner</p>' +
            '<h3>Step 3: Vitamin C Serum</h3>' +
            '<p>Most important in the morning</p>' +
            '<h3>Step 4: Moisturizer</h3>' +
            '<p>Light moisturizer</p>' +
            '<h3>Step 5: Sunscreen</h3>' +
            '<p><strong>Most important of all</strong></p>'
    },
    {
        id: 'blog-glowy-skin',
        title: '10 Tips for Glowing Skin',
        category: 'skincare',
        categoryLabel: '✨ Skincare',
        emoji: '✨',
        author: 'Dr. Sarah Ahmed',
        readTime: 6,
        date: Date.now() - (5 * 24 * 60 * 60 * 1000),
        excerpt: 'Simple daily habits that make a big difference.',
        content: 
            '<h2>✨ 10 Habits for Glowing Skin</h2>' +
            '<ol>' +
            '<li>Drink 2-3 liters of water</li>' +
            '<li>Sleep 7-8 hours</li>' +
            '<li>Do not touch your face</li>' +
            '<li>Change pillowcase weekly</li>' +
            '<li>Sunscreen daily</li>' +
            '<li>Cleanse before bed</li>' +
            '<li>Eat fruits and vegetables</li>' +
            '<li>Exercise regularly</li>' +
            '<li>Avoid stress</li>' +
            '<li>Be patient</li>' +
            '</ol>'
    },
    {
        id: 'blog-hair-loss',
        title: 'How to Treat Hair Loss?',
        category: 'hair',
        categoryLabel: '💇‍♀️ Hair',
        emoji: '💇‍♀️',
        author: 'Dr. Mona Khaled',
        readTime: 7,
        date: Date.now() - (7 * 24 * 60 * 60 * 1000),
        excerpt: 'Comprehensive guide to causes and treatments.',
        content: 
            '<h2>💇‍♀️ Hair Loss Treatment</h2>' +
            '<h3>🔍 First: Know the Cause</h3>' +
            '<ul>' +
            '<li>Genetic</li>' +
            '<li>Vitamin deficiency</li>' +
            '<li>Hormonal</li>' +
            '<li>Stress</li>' +
            '<li>Tight Hairstyles</li>' +
            '</ul>' +
            '<h3>💊 Treatment</h3>' +
            '<p>Depending on the cause. Supplements, minoxidil, hormonal treatment.</p>' +
            '<h3>⏰ When to See a Doctor?</h3>' +
            '<p>If loss is over 100 hairs daily or lasts over 2 months.</p>'
    },
    {
        id: 'blog-quick-makeup',
        title: '5-Minute Office Makeup',
        category: 'makeup',
        categoryLabel: '💄 Makeup',
        emoji: '💄',
        author: 'Velora Team',
        readTime: 4,
        date: Date.now() - (10 * 24 * 60 * 60 * 1000),
        excerpt: 'Quick morning makeup routine with fewest products.',
        content: 
            '<h2>💄 5-Minute Makeup</h2>' +
            '<h3>⏱️ Minute 1: Base</h3>' +
            '<p>BB cream + concealer</p>' +
            '<h3>⏱️ Minute 2: Eyebrows</h3>' +
            '<p>Quick eyebrow pencil</p>' +
            '<h3>⏱️ Minute 3: Eyes</h3>' +
            '<p>Mascara</p>' +
            '<h3>⏱️ Minute 4: Cheeks</h3>' +
            '<p>Cream blush</p>' +
            '<h3>⏱️ Minute 5: Lips</h3>' +
            '<p>Tinted lip balm</p>'
    },
    {
        id: 'blog-acne-oils',
        title: 'Best Oils for Acne Treatment',
        category: 'skincare',
        categoryLabel: '🌿 Skincare',
        emoji: '🌿',
        author: 'Dr. Rania Mahmoud',
        readTime: 5,
        date: Date.now() - (14 * 24 * 60 * 60 * 1000),
        excerpt: 'Some oils help, others make it worse. Know the difference.',
        content: 
            '<h2>🌿 Oils and Acne</h2>' +
            '<h3>❌ Oils to Avoid</h3>' +
            '<ul>' +
            '<li>Coconut oil — clogs pores</li>' +
            '<li>Sweet almond oil</li>' +
            '<li>Avocado oil</li>' +
            '</ul>' +
            '<h3>✅ Safe Oils</h3>' +
            '<ul>' +
            '<li>Jojoba oil</li>' +
            '<li>Tea tree oil (diluted)</li>' +
            '<li>Rose oil</li>' +
            '<li>Grape seed oil</li>' +
            '<li>Neem oil</li>' +
            '</ul>'
    },
    {
        id: 'blog-sun-protection',
        title: 'Protecting Skin from Sun',
        category: 'skincare',
        categoryLabel: '☀️ Skincare',
        emoji: '☀️',
        author: 'Velora Team',
        readTime: 6,
        date: Date.now() - (18 * 24 * 60 * 60 * 1000),
        excerpt: 'Everything you need to know about sunscreen.',
        content: 
            '<h2>☀️ Complete Sunscreen Guide</h2>' +
            '<h3>🔍 Types</h3>' +
            '<ul>' +
            '<li>Mineral: Safe, leaves white cast</li>' +
            '<li>Chemical: Transparent, absorbent</li>' +
            '<li>Hybrid: Best of both</li>' +
            '</ul>' +
            '<h3>💧 Correct Amount</h3>' +
            '<p>Teaspoon for face and neck</p>' +
            '<h3>⏰ Reapplication</h3>' +
            '<p>Every 2 hours in sun</p>'
    }
];

/* ============ SAMPLE REVIEWS (بدون fake reviews - دي حقيقية لما المستخدم يكتب) ============ */
const REVIEWS = [];

/* ============ EXPORT ============ */
window.MAHA_DATA = {
    PRODUCTS,
    CATEGORIES,
    GUIDE_ARTICLES,
    BLOG_ARTICLES,
    REVIEWS
};

console.log('✅ Data loaded:', {
    products: PRODUCTS.length,
    categories: CATEGORIES.length,
    guideArticles: GUIDE_ARTICLES.length,
    blogArticles: BLOG_ARTICLES.length
});

/* ============================================
   STAGE 3.5: PRODUCT FOUNDATION (Phase 1)
   Normalization + Access Layer
   - لا يحذف legacy fields
   - لا يغيّر UI أو Cart/Wishlist/Compare
   - يضيف new fields داخل نفس الـobject (Option A)
   - derived values محسوبة عبر دوال نقية (غير مخزنة)
   ============================================ */

console.log('🧱 Loading product foundation...');

/* ============ normalizeProduct ============ */
function normalizeProduct(product) {
    if (!product || typeof product !== 'object') return product;

    if (!('originalPrice' in product)) {
        product.originalPrice = (typeof product.oldPrice === 'number' && product.oldPrice > 0)
            ? product.oldPrice
            : null;
    }

    if (!('reviewCount' in product)) {
        product.reviewCount = (typeof product.reviewsCount === 'number')
            ? product.reviewsCount
            : 0;
    }

    if (!('skinTypes' in product)) {
        product.skinTypes = Array.isArray(product.skinType)
            ? product.skinType.slice()
            : [];
    }

    if (!('howToUse' in product)) {
        product.howToUse = (typeof product.usage === 'string')
            ? product.usage
            : '';
    }

    if (!('images' in product)) {
        product.images = [];
    }

    if (!('benefits' in product)) {
        product.benefits = [];
    }

    if (!('concerns' in product)) {
        product.concerns = [];
    }

    if (!('bundleEligible' in product)) {
        product.bundleEligible = false;
    }

    return product;
}

/* ============ normalizeAllProducts ============ */
function normalizeAllProducts() {
    if (!Array.isArray(MAHA_DATA?.PRODUCTS)) return 0;
    let count = 0;
    MAHA_DATA.PRODUCTS.forEach(p => {
        normalizeProduct(p);
        count++;
    });
    return count;
}

/* ============ Derived helpers (pure, not stored) ============ */
function getProductStockStatus(product) {
    if (!product) return 'out_of_stock';
    const s = Number(product.stock);
    if (!Number.isFinite(s) || s <= 0) return 'out_of_stock';
    if (s <= 10) return 'low_stock';
    return 'in_stock';
}

function getProductDiscountPercent(product) {
    if (!product) return 0;
    const orig = Number(product.originalPrice);
    const curr = Number(product.price);
    if (!Number.isFinite(orig) || !Number.isFinite(curr)) return 0;
    if (orig <= 0 || curr >= orig) return 0;
    return Math.round(((orig - curr) / orig) * 100);
}

/* ============ getProductById (Access Layer) ============ */
function getProductById(productId) {
    if (!productId) return null;
    if (!Array.isArray(MAHA_DATA?.PRODUCTS)) return null;
    const found = MAHA_DATA.PRODUCTS.find(p => p.id === productId);
    if (!found) return null;
    return normalizeProduct(found);
}

/* ============ getAllProducts (Access Layer helper) ============ */
function getAllProducts() {
    if (!Array.isArray(MAHA_DATA?.PRODUCTS)) return [];
    MAHA_DATA.PRODUCTS.forEach(normalizeProduct);
    return MAHA_DATA.PRODUCTS;
}

/* ============ runProductFoundation ============ */
(function runProductFoundation() {
    try {
        if (typeof normalizeAllProducts === 'function') {
            const n = normalizeAllProducts();
            console.log('🧱 Product foundation: normalized', n, 'products');
        }
    } catch (e) {
        console.error('❌ Product foundation failed:', e);
    }
})();

/* ============================================
   STAGE 3.6: DISCOVERY FOUNDATION (Phase 3A)
   Search Primitive — pure, no side effects
   - لا يعدّل Cart/Wishlist/Compare
   - لا يعدّل STATE / localStorage
   - لا يعمل UI / DOM / navigation
   ============================================ */

console.log('🔎 Loading search foundation...');

/* ============ searchProducts (pure) ============ */
function searchProducts(products, query, options) {
    if (!Array.isArray(products)) return [];
    if (products.length === 0) return [];

    const opts = (options && typeof options === 'object') ? options : {};

    const q = (typeof query === 'string') ? query.trim().toLowerCase() : '';
    if (q === '') {
        return products.slice();
    }

    const DEFAULT_FIELDS = [
        'name',
        'brand',
        'tags',
        'category',
        'subcategory',
        'ingredients',
        'description',
        'skinTypes',
        'skinType',
        'bestFor'
    ];

    const fields = Array.isArray(opts.fields) && opts.fields.length > 0
        ? opts.fields
        : DEFAULT_FIELDS;

    function stringMatches(value, needle) {
        if (typeof value !== 'string') return false;
        return value.toLowerCase().indexOf(needle) !== -1;
    }

    function arrayMatches(arr, needle) {
        if (!Array.isArray(arr)) return false;
        for (let i = 0; i < arr.length; i++) {
            const el = arr[i];
            if (typeof el === 'string' && el.toLowerCase().indexOf(needle) !== -1) {
                return true;
            }
        }
        return false;
    }

    

    const results = [];
    for (let i = 0; i < products.length; i++) {
        if (productMatches(products[i])) {
            results.push(products[i]);
        }
    }

    if (typeof opts.limit === 'number' && opts.limit > 0) {
        return results.slice(0, opts.limit);
    }

    return results;
}

/* ============================================
   STAGE 3.7: DISCOVERY FOUNDATION (Phase 3B)
   Filter Primitive — pure, no side effects
   ============================================ */

console.log('🎛️ Loading filter foundation...');

/* ============ filterProducts (pure) ============ */
/**
 * Pure filter over a products array.
 * - Does NOT mutate the input array.
 * - Does NOT mutate product objects.
 * - Does NOT touch MAHA_DATA / STATE / Cart / Wishlist / Compare / localStorage.
 * - Does NOT do UI / DOM / navigation.
 * - Preserves original order (no sorting, no limiting).
 *
 * @param {Array}  products
 * @param {Object} [filters]
 * @returns {Array} new array (subset of products, original order preserved)
 */
function filterProducts(products, filters) {
    // --- Safe guards ---
    if (!Array.isArray(products)) return [];

    // --- No filters → return a NEW COPY (never the same reference) ---
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
        return products.slice();
    }

    // --- Internal helpers (not exposed) ---

    function isEmptyValue(v) {
        return v === null || v === undefined || v === '';
    }

    function toNumber(v) {
        if (isEmptyValue(v)) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    function normalizeString(v) {
        return (typeof v === 'string') ? v.trim().toLowerCase() : '';
    }

    function safeStringEq(fieldValue, filterValue) {
        if (typeof fieldValue !== 'string') return false;
        return fieldValue.trim().toLowerCase() === normalizeString(filterValue);
    }

    function safeArrayHasMatch(arr, needle) {
        if (!Array.isArray(arr)) return false;
        const n = normalizeString(needle);
        if (n === '') return false;
        for (let i = 0; i < arr.length; i++) {
            const el = arr[i];
            if (typeof el === 'string' && el.trim().toLowerCase() === n) {
                return true;
            }
        }
        return false;
    }

    function safeArrayHasSubstring(arr, needle) {
        if (!Array.isArray(arr)) return false;
        const n = normalizeString(needle);
        if (n === '') return false;
        for (let i = 0; i < arr.length; i++) {
            const el = arr[i];
            if (typeof el === 'string' && el.toLowerCase().indexOf(n) !== -1) {
                return true;
            }
        }
        return false;
    }

    // --- Pre-compute active filters (only the valid ones) ---

    const hasCategory    = !isEmptyValue(filters.category)    && typeof filters.category    === 'string';
    const hasSubcategory = !isEmptyValue(filters.subcategory) && typeof filters.subcategory === 'string';
    const hasBrand       = !isEmptyValue(filters.brand)       && typeof filters.brand       === 'string';
    const hasBadge       = !isEmptyValue(filters.badge)       && typeof filters.badge       === 'string';
    const hasSkinType    = !isEmptyValue(filters.skinType)    && typeof filters.skinType    === 'string';
    const hasConcern     = !isEmptyValue(filters.concern)     && typeof filters.concern     === 'string';
    const hasTag         = !isEmptyValue(filters.tag)         && typeof filters.tag         === 'string';
    const hasStockStatus = !isEmptyValue(filters.stockStatus) && typeof filters.stockStatus === 'string';

    const priceMin  = toNumber(filters.priceMin);
    const priceMax  = toNumber(filters.priceMax);
    const ratingMin = toNumber(filters.ratingMin);

    const hasPriceMin  = priceMin  !== null;
    const hasPriceMax  = priceMax  !== null;
    const hasRatingMin = ratingMin !== null;

    const wantedCategory    = normalizeString(filters.category);
    const wantedSubcategory = normalizeString(filters.subcategory);
    const wantedBrand       = normalizeString(filters.brand);
    const wantedBadge       = normalizeString(filters.badge);
    const wantedSkinType    = normalizeString(filters.skinType);
    const wantedConcern     = normalizeString(filters.concern);
    const wantedTag         = normalizeString(filters.tag);
    const wantedStockStatus = normalizeString(filters.stockStatus);

    // --- Match single product ---
    function productMatches(product) {
        if (!product || typeof product !== 'object') return false;

        // category
        if (hasCategory && !safeStringEq(product.category, wantedCategory)) return false;

        // subcategory
        if (hasSubcategory && !safeStringEq(product.subcategory, wantedSubcategory)) return false;

        // brand
        if (hasBrand && !safeStringEq(product.brand, wantedBrand)) return false;

        // badge
        if (hasBadge && !safeStringEq(product.badge, wantedBadge)) return false;

        // priceMin
        if (hasPriceMin) {
            const p = toNumber(product.price);
            if (p === null || p < priceMin) return false;
        }

        // priceMax
        if (hasPriceMax) {
            const p = toNumber(product.price);
            if (p === null || p > priceMax) return false;
        }

        // ratingMin
        if (hasRatingMin) {
            const r = toNumber(product.rating);
            if (r === null || r < ratingMin) return false;
        }

        // skinType — prefer new field, fallback to legacy
        if (hasSkinType) {
            const source = Array.isArray(product.skinTypes) && product.skinTypes.length > 0
                ? product.skinTypes
                : product.skinType;
            if (!safeArrayHasMatch(source, wantedSkinType)) return false;
        }

        // concern — use bestFor temporarily (do NOT touch product.concerns)
        if (hasConcern) {
            if (!safeArrayHasMatch(product.bestFor, wantedConcern)) return false;
        }

        // tag — substring match inside array
        if (hasTag) {
            if (!safeArrayHasSubstring(product.tags, wantedTag)) return false;
        }

        // stockStatus — reuse Phase 1 logic only
        if (hasStockStatus) {
            let status;
            if (typeof getProductStockStatus === 'function') {
                status = getProductStockStatus(product);
            } else {
                // extremely defensive fallback (should never run in this project)
                const s = Number(product.stock);
                status = (!Number.isFinite(s) || s <= 0)
                    ? 'out_of_stock'
                    : (s <= 10 ? 'low_stock' : 'in_stock');
            }
            if (status !== wantedStockStatus) return false;
        }

        return true;
    }

    // --- Filter (preserve original order) ---
    const results = [];
    for (let i = 0; i < products.length; i++) {
        if (productMatches(products[i])) {
            results.push(products[i]);
        }
    }

    return results;
}

/* ============================================
   STAGE 3.8: DISCOVERY FOUNDATION (Phase 3C)
   Sorting Primitive — pure, no side effects
   ============================================ */

console.log('🔀 Loading sorting foundation...');

/* ============ getSortedProducts (pure) ============ */
/**
 * Pure sorting over a products array.
 * - Does NOT mutate the input array.
 * - Does NOT mutate product objects.
 * - Does NOT touch MAHA_DATA / STATE / Cart / Wishlist / Compare / localStorage.
 * - Does NOT do UI / DOM / navigation.
 * - Returns a NEW array.
 * - Preserves original relative order for equal values (best-effort stability).
 *
 * Supported sortKey:
 *   'price-low'   → ascending by numeric price
 *   'price-high'  → descending by numeric price
 *   'rating'      → descending by numeric rating
 *   'name'        → alphabetical (localeCompare)
 *   'bestseller'  → badge === 'bestseller' first
 *   'default'     → same as 'bestseller' (badge priority only)
 *   unknown/missing → new copy, original order preserved
 *
 * @param {Array}  products
 * @param {string} [sortKey]
 * @returns {Array} new array
 */
function getSortedProducts(products, sortKey) {
    if (!Array.isArray(products)) return [];
    if (products.length === 0) return [];

    const results = products.slice();

    const key = (typeof sortKey === 'string') ? sortKey.trim().toLowerCase() : '';

    if (key === '') {
        return results;
    }

    // --- Safe number extraction ---
    function safeNum(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    // --- Safe string extraction ---
    

    // --- Stable sort helper ---
    // Modern JS engines (V8) use stable Array.prototype.sort,
    // so we can rely on stability directly.
    switch (key) {

        case 'price-low':
            results.sort((a, b) => {
                const pa = safeNum(a && a.price);
                const pb = safeNum(b && b.price);
                if (pa === null && pb === null) return 0;
                if (pa === null) return 1;
                if (pb === null) return -1;
                return pa - pb;
            });
            return results;

        case 'price-high':
            results.sort((a, b) => {
                const pa = safeNum(a && a.price);
                const pb = safeNum(b && b.price);
                if (pa === null && pb === null) return 0;
                if (pa === null) return 1;
                if (pb === null) return -1;
                return pb - pa;
            });
            return results;

        case 'rating':
            results.sort((a, b) => {
                const ra = safeNum(a && a.rating);
                const rb = safeNum(b && b.rating);
                if (ra === null && rb === null) return 0;
                if (ra === null) return 1;
                if (rb === null) return -1;
                return rb - ra;
            });
            return results;

        case 'name':
            results.sort((a, b) => {
                const na = safeStr(a && a.name);
                const nb = safeStr(b && b.name);
                return na.localeCompare(nb);
            });
            return results;

        case 'bestseller':
        case 'default':
            results.sort((a, b) => {
                const aBest = (a && a.badge === 'bestseller') ? 1 : 0;
                const bBest = (b && b.badge === 'bestseller') ? 1 : 0;
                return bBest - aBest;
            });
            return results;

        default:
            // unknown key → new copy, original order
            return results;
    }
}
/* ============================================
   STAGE 3.9: DISCOVERY FOUNDATION (Phase 3D)
   Related Products Primitive — pure, no side effects
   - لا يعتمد على hardcoded IDs
   - لا يستخدم random
   - لا يستخدم fake popularity
   ============================================ */

console.log('🔗 Loading related products foundation...');

/* ============ getRelatedProducts (pure) ============ */
/**
 * Pure related-products resolver.
 * Computes a deterministic ranking based on product attributes.
 *
 * Scoring weights:
 *   same category       +40
 *   same subcategory    +30
 *   same brand          +15
 *   each shared tag     +5
 *   each shared skin    +5
 *   each shared concern +5
 *
 * A related product must have score >= MIN_SCORE.
 *
 * Tie-breaking:
 *   1) higher score first
 *   2) higher rating
 *   3) alphabetical by name
 *   4) original product order
 *
 * @param {string} productId
 * @param {number} [limit=6]
 * @returns {Array}
 */


/* ============================================
   STAGE 3.9: DISCOVERY FOUNDATION (Phase 3D)
   Related Products Primitive — pure, no side effects
   - لا يعتمد على hardcoded IDs
   - لا يستخدم random
   - لا يستخدم fake popularity
   ============================================ */

console.log('🔗 Loading related products foundation...');

/* ============ getRelatedProducts (pure) ============ */
/**
 * Pure related-products resolver.
 * Computes a deterministic ranking based on product attributes.
 *
 * Scoring weights:
 *   same category       +40
 *   same subcategory    +30
 *   same brand          +15
 *   each shared tag     +5
 *   each shared skin    +5
 *   each shared concern +5
 *
 * A related product must have score >= MIN_SCORE.
 * Returns [] if nothing meaningful is related.
 *
 * Tie-breaking (deterministic):
 *   1) higher score first
 *   2) higher rating
 *   3) alphabetical by name
 *   4) stable fallback (index in source array)
 *
 * @param {string} productId
 * @param {number} [limit=6]
 * @returns {Array}
 */
function getRelatedProducts(productId, limit) {
    // --- Safe guards ---
    if (!productId || typeof productId !== 'string') return [];

    const products = (typeof getAllProducts === 'function') ? getAllProducts() : [];
    if (!Array.isArray(products) || products.length === 0) return [];

    const source = (typeof getProductById === 'function')
        ? getProductById(productId)
        : null;
    if (!source) return [];

    // --- Normalize limit ---
    let max = 6;
    if (typeof limit === 'number' && isFinite(limit) && limit > 0) {
        max = Math.floor(limit);
    } else if (limit === 0) {
        return [];
    }

    // --- Minimum meaningful score ---
    // +40 (category) or +30 (subcategory) or +15 (brand) or +5 * 2 (two tags/skins)
    // Threshold = 10 means at least 2 shared tags/skins/concerns, OR brand+something, etc.
    const MIN_SCORE = 10;

    // --- Internal helpers ---
    function safeStr(v) {
        return (typeof v === 'string') ? v.trim().toLowerCase() : '';
    }

    function safeArr(v) {
        return Array.isArray(v) ? v : [];
    }

    function normalizedSet(arr) {
        const s = new Set();
        const a = safeArr(arr);
        for (let i = 0; i < a.length; i++) {
            const v = safeStr(a[i]);
            if (v) s.add(v);
        }
        return s;
    }

    function countOverlap(setA, setB) {
        let count = 0;
        setA.forEach(v => { if (setB.has(v)) count++; });
        return count;
    }

    // --- Pre-compute source attribute sets ---
    const srcCategory    = safeStr(source.category);
    const srcSubcategory = safeStr(source.subcategory);
    const srcBrand       = safeStr(source.brand);
    const srcTags        = normalizedSet(source.tags);

    // skinTypes (new) preferred, fallback to skinType (legacy)
    const srcSkinSource = (Array.isArray(source.skinTypes) && source.skinTypes.length > 0)
        ? source.skinTypes
        : source.skinType;
    const srcSkins = normalizedSet(srcSkinSource);

    // concerns (new) preferred, fallback to bestFor (legacy)
    const srcConcernSource = (Array.isArray(source.concerns) && source.concerns.length > 0)
        ? source.concerns
        : source.bestFor;
    const srcConcerns = normalizedSet(srcConcernSource);

    // --- Scoring per candidate ---
    const scored = [];

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p || typeof p !== 'object') continue;

        // Exclude source product
        if (p.id === productId) continue;

        let score = 0;

        // same category
        if (srcCategory && safeStr(p.category) === srcCategory) score += 40;

        // same subcategory
        if (srcSubcategory && safeStr(p.subcategory) === srcSubcategory) score += 30;

        // same brand
        if (srcBrand && safeStr(p.brand) === srcBrand) score += 15;

        // shared tags
        if (srcTags.size > 0) {
            const pTags = normalizedSet(p.tags);
            score += countOverlap(srcTags, pTags) * 5;
        }

        // shared skin types
        if (srcSkins.size > 0) {
            const pSkinSource = (Array.isArray(p.skinTypes) && p.skinTypes.length > 0)
                ? p.skinTypes
                : p.skinType;
            const pSkins = normalizedSet(pSkinSource);
            score += countOverlap(srcSkins, pSkins) * 5;
        }

        // shared concerns
        if (srcConcerns.size > 0) {
            const pConcernSource = (Array.isArray(p.concerns) && p.concerns.length > 0)
                ? p.concerns
                : p.bestFor;
            const pConcerns = normalizedSet(pConcernSource);
            score += countOverlap(srcConcerns, pConcerns) * 5;
        }

        if (score >= MIN_SCORE) {
            scored.push({
                product: p,
                score: score,
                // stable fallback: original index
                _index: i
            });
        }
    }

    // --- Deterministic sort ---
    scored.sort((a, b) => {
        // 1) score desc
        if (b.score !== a.score) return b.score - a.score;

        // 2) rating desc (safe)
        const ra = Number(a.product.rating);
        const rb = Number(b.product.rating);
        const na = Number.isFinite(ra) ? ra : -Infinity;
        const nb = Number.isFinite(rb) ? rb : -Infinity;
        if (na !== nb) return nb - na;

        // 3) name asc (safe)
        const nameA = (typeof a.product.name === 'string') ? a.product.name : '';
        const nameB = (typeof b.product.name === 'string') ? b.product.name : '';
        const cmp = nameA.localeCompare(nameB);
        if (cmp !== 0) return cmp;

        // 4) stable fallback
        return a._index - b._index;
    });

    // --- Apply limit + strip internal _index ---
    const result = [];
    const maxOut = Math.min(max, scored.length);
    for (let i = 0; i < maxOut; i++) {
        result.push(scored[i].product);
    }

    return result;
}
/* ============================================
   STAGE 3.10: DISCOVERY PIPELINE (Phase 3E)
   Pipeline Primitive — pure, no side effects
   - Composes existing primitives:
       searchProducts → filterProducts → getSortedProducts → limit
   - Does NOT rewrite any primitive.
   - Does NOT use getRelatedProducts.
   - Does NOT touch MAHA_DATA / STATE / Cart / Wishlist / Compare / localStorage.
   - Does NOT do UI / DOM / navigation.
   - Does NOT mutate input array or product objects.
   - Always returns a NEW array.
   ============================================ */

console.log('🧭 Loading discovery pipeline...');

/* ============ discoverProducts (pure) ============ */
/**
 * Pure discovery pipeline.
 * Composes existing primitives in a fixed order:
 *   products → search → filter → sort → limit → results
 *
 * Options:
 *   {
 *     query:   string   | null | undefined  → passed to searchProducts
 *     filters: object   | null | undefined  → passed to filterProducts
 *     sortKey: string   | null | undefined  → passed to getSortedProducts
 *     limit:   number   | null | undefined  → applied AFTER sort
 *   }
 *
 * Limit rules:
 *   - missing           → no limit
 *   - 0                 → returns []
 *   - > 0 (after floor) → slice
 *   - < 0               → ignored
 *   - non-number        → ignored
 *   - Infinity          → ignored
 *
 * @param {Array}  products
 * @param {Object} [options]
 * @returns {Array} new array
 */
function discoverProducts(products, options) {
    // --- Input guard ---
    if (!Array.isArray(products)) return [];
    if (products.length === 0) return [];

    // --- Options normalization ---
    let opts;
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        opts = {};
    } else {
        opts = options;
    }

    // --- Start with a defensive copy (never mutate input) ---
    let result = products.slice();

    // --- [1] SEARCH ---
    const rawQuery = opts.query;
    const hasQuery =
        typeof rawQuery === 'string' &&
        rawQuery.trim() !== '';

    if (hasQuery && typeof searchProducts === 'function') {
        result = searchProducts(result, rawQuery);
    }

    // Early exit if search yielded nothing
    if (result.length === 0) return result;

    // --- [2] FILTER ---
    const rawFilters = opts.filters;
    let hasFilters = false;

    if (
        rawFilters &&
        typeof rawFilters === 'object' &&
        !Array.isArray(rawFilters)
    ) {
        // Treat non-empty object as active
        for (const k in rawFilters) {
            if (Object.prototype.hasOwnProperty.call(rawFilters, k)) {
                hasFilters = true;
                break;
            }
        }
    }

    if (hasFilters && typeof filterProducts === 'function') {
        result = filterProducts(result, rawFilters);
    }

    // Early exit if filter yielded nothing
    if (result.length === 0) return result;

    // --- [3] SORT ---
    const rawSortKey = opts.sortKey;
    const hasSort =
        typeof rawSortKey === 'string' &&
        rawSortKey.trim() !== '';

    if (hasSort && typeof getSortedProducts === 'function') {
        result = getSortedProducts(result, rawSortKey);
    }

    // --- [4] LIMIT (applied AFTER sort) ---
    const rawLimit = opts.limit;

    // Explicit zero → empty array
    if (rawLimit === 0) return [];

    // Valid positive finite number → apply
    if (
        typeof rawLimit === 'number' &&
        isFinite(rawLimit) &&
        rawLimit > 0
    ) {
        const n = Math.floor(rawLimit);
        if (n > 0) {
            result = result.slice(0, n);
        }
    }
    // else: missing / negative / non-number / Infinity → ignore limit

    return result;
}
/* ============================================
   STAGE 3.11: DISCOVERY API (Phase 3F)
   Public read-only discovery entry point
   ============================================ */

console.log('🚪 Loading discovery API...');

function discoverProductsAPI(options) {
    let opts;

    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        opts = {};
    } else {
        opts = options;
    }

    const products =
        (typeof getAllProducts === 'function')
            ? getAllProducts()
            : [];

    return discoverProducts(products, opts);
}

/* ============================================
   VELORA - Core Logic
   Navigation + Cart + Auth + Search + Rendering
   ============================================ */

console.log('⚙️ Loading core logic...');

/* ============ STATE ============ */
const STATE = {
    currentPage: 'home',
    currentCategory: 'all',
    currentSort: 'featured',
    searchQuery: '',
    cart: [],
    favorites: [],
    user: null
};

/* ============ STORAGE KEYS ============ */
const KEYS = {
    CART: 'maha_cart',
    FAVORITES: 'maha_favorites',
    USER: 'maha_user',
    USERS: 'maha_users',
    THEME: 'maha_theme'
};

/* ============ UTILITIES ============ */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch(e) {
        console.error('Save error:', e);
        return false;
    }
}

function getFromStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        if (!value) return defaultValue;
        try {
            return JSON.parse(value);
        } catch(e) {
            return value;
        }
    } catch(e) {
        return defaultValue;
    }
}

/* ============ GLOBAL CURRENCY ============ */
const VELORA_CURRENCY_META = {
    USD:{symbol:'$',locale:'en-US',digits:2}, EUR:{symbol:'€',locale:'de-DE',digits:2}, GBP:{symbol:'£',locale:'en-GB',digits:2}, EGP:{symbol:'EGP',locale:'en-US',digits:2},
    AED:{symbol:'AED',locale:'en-AE',digits:2}, SAR:{symbol:'SAR',locale:'en-SA',digits:2}, QAR:{symbol:'QAR',locale:'en-QA',digits:2}, KWD:{symbol:'KWD',locale:'en-KW',digits:3}, BHD:{symbol:'BHD',locale:'en-BH',digits:3}, OMR:{symbol:'OMR',locale:'en-OM',digits:3},
    CAD:{symbol:'CA$',locale:'en-CA',digits:2}, AUD:{symbol:'A$',locale:'en-AU',digits:2}, NZD:{symbol:'NZ$',locale:'en-NZ',digits:2}, CHF:{symbol:'CHF',locale:'de-CH',digits:2}, JPY:{symbol:'¥',locale:'ja-JP',digits:0}, CNY:{symbol:'CN¥',locale:'zh-CN',digits:2}, INR:{symbol:'₹',locale:'en-IN',digits:2}, TRY:{symbol:'₺',locale:'tr-TR',digits:2}, BRL:{symbol:'R$',locale:'pt-BR',digits:2}, MXN:{symbol:'MX$',locale:'es-MX',digits:2}, ZAR:{symbol:'R',locale:'en-ZA',digits:2}, SEK:{symbol:'SEK',locale:'sv-SE',digits:2}, NOK:{symbol:'NOK',locale:'nb-NO',digits:2}, DKK:{symbol:'DKK',locale:'da-DK',digits:2}, PLN:{symbol:'PLN',locale:'pl-PL',digits:2}, SGD:{symbol:'S$',locale:'en-SG',digits:2}, HKD:{symbol:'HK$',locale:'zh-HK',digits:2}, KRW:{symbol:'₩',locale:'ko-KR',digits:0}, THB:{symbol:'฿',locale:'th-TH',digits:2}, IDR:{symbol:'Rp',locale:'id-ID',digits:2}, MYR:{symbol:'RM',locale:'ms-MY',digits:2}, PHP:{symbol:'₱',locale:'en-PH',digits:2}, PKR:{symbol:'PKR',locale:'en-PK',digits:2}, ILS:{symbol:'₪',locale:'he-IL',digits:2}
};

function detectVeloraCurrency() {
    const saved=getFromStorage('velora_currency',null); if(saved&&VELORA_CURRENCY_META[saved]) return saved;
    const lang=String(navigator.language||'').toLowerCase();
    const byLocale=[['de','EUR'],['fr','EUR'],['es','EUR'],['it','EUR'],['pt','EUR'],['nl','EUR'],['en-gb','GBP'],['en-au','AUD'],['en-ca','CAD'],['en-in','INR'],['ar-eg','EGP'],['ar-ae','AED'],['ar-sa','SAR'],['ar-qa','QAR'],['ar-kw','KWD'],['ar-bh','BHD'],['ar-om','OMR'],['tr','TRY'],['zh','CNY'],['ja','JPY'],['ko','KRW'],['th','THB'],['id','IDR'],['ms','MYR'],['pl','PLN'],['sv','SEK'],['no','NOK'],['da','DKK'],['he','ILS']];
    const hit=byLocale.find(([prefix])=>lang===prefix||lang.startsWith(prefix+'-')); return hit?hit[1]:'USD';
}
window.VELORA_CURRENCY_META = VELORA_CURRENCY_META;
let VELORA_CURRENCY = detectVeloraCurrency();

function setVeloraCurrency(code) {
    if (!VELORA_CURRENCY_META[code]) return false;
    VELORA_CURRENCY = code;
    saveToStorage('velora_currency', code);
    if (typeof renderSellerDashboard==='function' && SELLER_STATE?.currentSeller && SELLER_STATE.currentSection==='dashboard') { const c=document.getElementById('sellerContent'); if(c) c.innerHTML=renderSellerDashboard(SELLER_STATE.currentSeller); }
    if (typeof updateAccountButton==='function') updateAccountButton();
    return true;
}

function formatPrice(price, currency = VELORA_CURRENCY) {
    const meta = VELORA_CURRENCY_META[currency] || VELORA_CURRENCY_META.USD;
    const value = Number.isFinite(Number(price)) ? Number(price) : 0;
    const formatted = new Intl.NumberFormat(meta.locale, {
        minimumFractionDigits: meta.digits,
        maximumFractionDigits: meta.digits
    }).format(value);
    return `${meta.symbol} ${formatted}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function renderStars(rating) {
    const full = Math.floor(rating || 0);
    let html = '';
    for (let i = 0; i < 5; i++) {
        html += i < full ? '⭐' : '☆';
    }
    return html;
}

function debounce(fn, delay = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

/* ============ VELORA MARKETPLACE FOUNDATION ============ */
function openMarketplaceCategory(category) {
    navigateTo('shop');
    setTimeout(() => {
        const supported = new Set(['all', ...VELORA_PRODUCT_CATEGORIES.map(c=>c.id)]);
        if (supported.has(category)) {
            const btn = document.querySelector(`.filter-tab[data-cat="${category}"]`);
            if (btn) filterShop(category, btn);
        } else {
            showToast('🚀 ' + category.charAt(0).toUpperCase() + category.slice(1) + ' is coming soon as Velora grows its marketplace.', 'info');
        }
    }, 120);
}

async function renderMarketplaceStores() {
    const container = document.getElementById('marketplaceStores');
    if (!container) return;
    try {
        const db = window.mahaSupabase || window.supabaseClient || window.sb || null;
        if (!db?.rpc) throw new Error('marketplace_rpc_unavailable');
        const locale = String(localStorage.getItem('velora_language') || 'en').toLowerCase();
        const currency = String(localStorage.getItem('velora_currency') || 'EGP').toUpperCase();
        const country = String(localStorage.getItem('velora_country') || '*').toUpperCase();
        const r = await db.rpc('velora_get_marketplace_catalog', { p_country_code: country === '*' ? null : country, p_currency_code: currency, p_category_slug: null, p_search: null, p_limit: 100, p_offset: 0 });
        if (r?.error) throw r.error;
        const rows = Array.isArray(r?.data) ? r.data : [];
        const byStore = new Map();
        rows.forEach(row => {
            const key = row.store_id || row.store_slug || row.store_name;
            if (!key || byStore.has(key)) return;
            byStore.set(key, row);
        });
        const stores = [...byStore.values()];
        if (!stores.length) {
            container.innerHTML = `<div class="velora-empty-store" style="grid-column:1/-1"><div style="font-size:3rem">🏪</div><h2>${typeof tr==='function' ? tr('Be one of the first stores on Velora') : 'Be one of the first stores on Velora'}</h2><p>${typeof tr==='function' ? tr('Velora is opening its marketplace to independent sellers and brands.') : 'Velora is opening its marketplace to independent sellers and brands.'}</p><button class="btn btn-primary" onclick="openSellerRegistration()">🚀 ${typeof tr==='function' ? tr('Become a Seller') : 'Become a Seller'}</button></div>`;
            return;
        }
        container.innerHTML = stores.map(s => `<article class="velora-store-card"><div class="velora-store-icon">🏪</div><span class="section-label">${escapeHtml(s.category_name || 'MARKETPLACE STORE')}</span><h3>${escapeHtml(s.store_name || 'Velora Store')}</h3><p>${escapeHtml(s.product_description || (typeof tr==='function' ? tr('Discover products from this independent seller on Velora.') : 'Discover products from this independent seller on Velora.'))}</p><button class="btn btn-outline" onclick="showToast('🏪 ${typeof tr==='function' ? tr('Visit Store') : 'Visit Store'}', 'info')">${typeof tr==='function' ? tr('Visit Store') : 'Visit Store'}</button></article>`).join('');
    } catch (e) {
        console.error('Velora marketplace stores load failed:', e);
        container.innerHTML = `<div class="velora-empty-store" style="grid-column:1/-1"><div style="font-size:3rem">⚠️</div><h2>${typeof tr==='function' ? tr('Marketplace temporarily unavailable') : 'Marketplace temporarily unavailable'}</h2><p>${typeof tr==='function' ? tr('Please try again in a moment.') : 'Please try again in a moment.'}</p></div>`;
    }
}

function renderMarketplaceDeals() {
    const container = document.getElementById('dealsProducts');
    if (!container || typeof MAHA_DATA === 'undefined') return;
    const products = (MAHA_DATA.PRODUCTS || []).slice(0, 12);
    container.innerHTML = products.map(renderProductCard).join('');
}

/* ============ NAVIGATION ============ */
function navigateTo(page) {
    if (!page) return;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) {
        target.classList.add('active');
    }

    // Update nav active state
    document.querySelectorAll('.main-nav a, .mobile-menu-list a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('onclick')?.includes("'" + page + "'")) {
            a.classList.add('active');
        }
    });

    STATE.currentPage = page;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile menu
    closeMobileMenu();

    // Update URL hash
    try {
        const url = new URL(window.location);
        url.hash = page === 'home' ? '' : page;
        window.history.replaceState({}, '', url);
    } catch(e) {}

    // Load page content
    loadPageContent(page);

    console.log('📍 Navigate:', page);
}

function loadPageContent(page) {
    switch(page) {
        case 'home':
            renderCategories();
            renderFeaturedProducts();
            break;
        case 'shop':
            renderShopProducts();
            break;
        case 'shops':
            renderMarketplaceStores();
            break;
        case 'deals':
            renderMarketplaceDeals();
            break;
        case 'guide':
            renderGuideArticles();
            break;
        case 'blog':
            renderBlogArticles();
            break;
        case 'compare':
            renderComparePage();
            break;
        case 'reviews':
            renderReviewsPage();
            break;
        case 'favorites':
            renderFavoritesPage();
            break;
        case 'cart':
            renderCartPage();
            break;
        case 'checkout':
            renderCheckoutPage();
            break;
        case 'orders':
            renderOrdersPage();
            break;
        case 'account':
            renderAccountPage();
            break;
    }
}

/* ============ MOBILE MENU ============ */
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    if (menu) menu.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
}

function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

/* ============ THEME ============ */
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    saveToStorage(KEYS.THEME, newTheme);

    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
    const saved = getFromStorage(KEYS.THEME, 'light');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ============ CATEGORIES ============ */
function renderCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;

    container.innerHTML = MAHA_DATA.CATEGORIES.map(cat => `
        <div class="category-card" onclick="filterByCategory('${cat.id}')">
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${escapeHtml(cat.name)}</div>
        </div>
    `).join('');
}

function filterByCategory(category) {
    STATE.currentCategory = category;
    navigateTo('shop');
    setTimeout(() => {
        // Update filter tabs
        document.querySelectorAll('.filter-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.cat === category);
        });
        renderShopProducts();
    }, 100);
}

/* ============ PRODUCT RENDERING ============ */
function veloraLocalizedProduct(input){
    const product = input || {};
    const loc = (window.VELORA_GLOBAL_LOCALE || localStorage.getItem('velora_language') || 'en').toLowerCase();
    if(loc==='en') return product;
    const row = window.VELORA_LOCALIZED_CONTENT?.products?.[String(product.id)] || null;
    if(!row) return product;
    return Object.assign({}, product, {
        name: row.name || product.name,
        description: row.description || product.description,
        seo_title: row.seo_title || product.seo_title,
        seo_description: row.seo_description || product.seo_description
    });
}

async function veloraLoadContentTranslations(locale){
    try{
        const db = (typeof getDb==='function' ? getDb() : window.mahaSupabase || window.supabaseClient);
        if(!db?.rpc) return;
        const products = Array.isArray(window.MAHA_DATA?.PRODUCTS) ? window.MAHA_DATA.PRODUCTS.map(x=>x.id).filter(Boolean) : [];
        const storeIds = Array.isArray(window.MAHA_DATA?.STORES) ? window.MAHA_DATA.STORES.map(x=>x.id).filter(Boolean) : [];
        const categoryIds = Array.isArray(window.MAHA_DATA?.CATEGORIES) ? window.MAHA_DATA.CATEGORIES.map(x=>x.id).filter(x=>String(x).match(/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i)) : [];
        if(!products.length && !storeIds.length && !categoryIds.length) return;
        const r = await db.rpc('velora_get_localized_content',{p_locale:locale,p_product_ids:products,p_store_ids:storeIds,p_category_ids:categoryIds});
        if(!r.error && r.data) window.VELORA_LOCALIZED_CONTENT = r.data;
    }catch(_){ }
}

function veloraLocalizedStore(input){
    const store=input||{}; const row=window.VELORA_LOCALIZED_CONTENT?.stores?.[String(store.id)]||null;
    if(!row) return store;
    return Object.assign({},store,{storeName:row.name||store.storeName,name:row.name||store.name,description:row.description||store.description});
}

function renderProductCard(inputProduct) {
    const product = veloraLocalizedProduct(inputProduct);
    const isFav = STATE.favorites.some(f => f.id === product.id);
    const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
    const stars = renderStars(product.rating);

    return `
        <div class="product-card" data-id="${product.id}" data-product-id="${product.id}">
            <div class="product-image" onclick="openProductDetail('${product.id}')">
                <span>${product.emoji || '📦'}</span>
                <div class="product-badges">
                    ${discount > 0 ? `<span class="product-badge badge-sale">-${discount}%</span>` : ''}
                    ${product.badge === 'bestseller' ? `<span class="product-badge badge-bestseller">Bestseller</span>` : ''}
                    ${product.badge === 'hot' ? `<span class="product-badge badge-hot">🔥 Hot</span>` : ''}
                </div>
                <button class="product-fav ${isFav ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleFavorite('${product.id}', this)">
                    ${isFav ? '❤️' : '🤍'}
                </button>
            </div>
            <div class="product-info">
                <div class="product-category">${escapeHtml(product.subcategory)}</div>
                <div class="product-name" onclick="openProductDetail('${product.id}')">${escapeHtml(product.name)}</div>
                <div class="product-brand">${escapeHtml(product.brand)}</div>
                <div class="product-rating">
                    <span class="stars">${stars}</span>
                    <span style="color: var(--text-muted); font-size: 0.8rem;">${product.rating}</span>
                </div>
                <div class="product-footer">
                    <div class="product-price">
                        <span class="price-current">${formatPrice(product.price)}</span>
                        ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ''}
                    </div>
                    <button class="add-cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">🛒</button>
                </div>
            </div>
        </div>
    `;
}

function renderFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    const featured = MAHA_DATA.PRODUCTS
        .filter(p => p.badge === 'bestseller' || p.badge === 'hot')
        .slice(0, 8);

    container.innerHTML = featured.map(renderProductCard).join('');
}

/* ============ SHOP PAGE ============ */
function renderShopProducts() {
    const container = document.getElementById('shopProducts');
    if (!container) return;

let products = discoverProductsAPI({
    query: STATE.searchQuery,
    filters: {
        category: STATE.currentCategory !== 'all'
            ? STATE.currentCategory
            : undefined
    },
    sortKey: STATE.currentSort === 'featured'
        ? 'default'
        : STATE.currentSort
});

    // Update counter
    const counter = document.getElementById('resultsCount');
    if (counter) counter.textContent = products.length;

    // Render
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No products found</h3>
                <p>Try different keywords or filters</p>
            </div>
        `;
    } else {
        container.innerHTML = products.map(renderProductCard).join('');
    }
}

function filterShop(category, btn) {
    STATE.currentCategory = category;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderShopProducts();
}

function handleShopSearch(query) {
    STATE.searchQuery = query;
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';
    renderShopProducts();
}

function clearShopSearch() {
    STATE.searchQuery = '';
    const input = document.getElementById('shopSearch');
    if (input) input.value = '';
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    renderShopProducts();
}

function sortProducts(value) {
    STATE.currentSort = value;
    renderShopProducts();
}

/* ============ PRODUCT DETAIL ============ */
function openProductDetail(productId) {
    const product = veloraLocalizedProduct(MAHA_DATA.PRODUCTS.find(p => p.id === productId));
    if (!product) return;

    const isFav = STATE.favorites.some(f => f.id === productId);
    const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

    const modal = document.getElementById('productModal');
    const content = document.getElementById('productModalContent');
    if (!modal || !content) return;

    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div style="aspect-ratio: 1; background: linear-gradient(135deg, rgba(212,112,138,0.1), rgba(155,111,168,0.1)); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 8rem; position: relative;">
                ${product.emoji}
                ${discount > 0 ? `<div style="position: absolute; top: 1rem; left: 1rem; background: #f44336; color: #fff; padding: 0.3rem 0.8rem; border-radius: 999px; font-weight: 900; font-size: 0.9rem;">-${discount}%</div>` : ''}
            </div>
            <div>
                <div style="font-size: 0.8rem; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">${escapeHtml(product.subcategory)}</div>
                <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem;">${escapeHtml(product.name)}</h2>
                <div style="color: var(--text-muted); font-size: 1rem; margin-bottom: 1rem;">${escapeHtml(product.brand)}</div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span style="font-size: 1.1rem;">${renderStars(product.rating)}</span>
                    <span style="color: var(--text-muted);">${product.rating} (${product.reviewsCount} reviews)</span>
                </div>
                <div style="display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1.5rem;">
                    <span style="font-size: 2rem; font-weight: 900; color: var(--primary);">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span style="font-size: 1.25rem; color: var(--text-muted); text-decoration: line-through;">${formatPrice(product.oldPrice)}</span>` : ''}
                </div>
                <p style="color: var(--text-muted); line-height: 1.7; margin-bottom: 1.5rem;">${escapeHtml(product.description)}</p>
                
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem;">🧪 Ingredients</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                        ${(product.ingredients || []).map(i => `<span style="padding: 0.25rem 0.75rem; background: var(--bg-alt); border-radius: 999px; font-size: 0.8rem;">${escapeHtml(i)}</span>`).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem;">✅ Pros</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${(product.pros || []).map(p => `<li style="padding: 0.25rem 0; font-size: 0.9rem;">✅ ${escapeHtml(p)}</li>`).join('')}
                    </ul>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem;">⚠️ Cons</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${(product.cons || []).map(c => `<li style="padding: 0.25rem 0; font-size: 0.9rem; color: var(--text-muted);">❌ ${escapeHtml(c)}</li>`).join('')}
                    </ul>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem;">🧴 How to Use</h4>
                    <p style="color: var(--text-muted); line-height: 1.6; font-size: 0.9rem;">
                        ${escapeHtml(product.usage || product.howToUse || 'Follow the product instructions for best results.')}
                    </p>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem;">🎯 Best For</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                        ${(product.bestFor || product.skinTypes || product.skinType || []).map(item => `
                            <span style="padding: 0.3rem 0.75rem; background: var(--bg-alt); border-radius: 999px; font-size: 0.8rem;">
                                ${escapeHtml(item)}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                    <button class="btn btn-primary btn-lg" style="flex: 1;" onclick="addToCart('${product.id}'); closeModal('productModal');">
                        🛒 Add to Cart
                    </button>
                    <button class="btn btn-outline btn-lg" onclick="toggleFavorite('${product.id}', this)">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
        </div>
    `;
    const relatedProducts = getRelatedProducts(product.id, 6);

    if (relatedProducts.length > 0) {
        content.innerHTML += `
            <div style="margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                <h3 style="font-size: 1.35rem; margin-bottom: 1.25rem;">
                    ✨ You May Also Like
                </h3>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
                    ${relatedProducts.map(p => `
                        <div
                            style="border: 1px solid var(--border); border-radius: 14px; overflow: hidden; cursor: pointer; background: var(--bg);"
                            onclick="openProductDetail('${p.id}')"
                        >
                            <div style="aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: var(--bg-alt); font-size: 4rem;">
                                ${p.emoji || '📦'}
                            </div>

                            <div style="padding: 0.9rem;">
                                <div style="font-size: 0.75rem; color: var(--primary); margin-bottom: 0.35rem;">
                                    ${escapeHtml(p.subcategory || '')}
                                </div>

                                <div style="font-weight: 800; margin-bottom: 0.3rem;">
                                    ${escapeHtml(p.name)}
                                </div>

                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                    ${escapeHtml(p.brand || '')}
                                </div>

                                <div style="margin-bottom: 0.5rem;">
                                    ${renderStars(p.rating)}
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">
                                        ${p.rating}
                                    </span>
                                </div>

                                <div style="font-weight: 900; color: var(--primary);">
                                    ${formatPrice(p.price)}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }


    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}


/* ============ CART ============ */
function addToCart(productId, quantity = 1) {
    const product = MAHA_DATA.PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = STATE.cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        STATE.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            emoji: product.emoji,
            quantity: quantity
        });
    }

    saveToStorage(KEYS.CART, STATE.cart);
    updateCartBadge();
    showToast('✅ Added to cart', 'success');
    renderCartSidebar();
}

function removeFromCart(productId) {
    STATE.cart = STATE.cart.filter(item => item.id !== productId);
    saveToStorage(KEYS.CART, STATE.cart);
    updateCartBadge();
    renderCartSidebar();
    renderCartPage();
    showToast('🗑️ Removed from cart', 'info');
}

function updateQuantity(productId, change) {
    const item = STATE.cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveToStorage(KEYS.CART, STATE.cart);
    updateCartBadge();
    renderCartSidebar();
    renderCartPage();
}

function getCartTotal() {
    return STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getCartCount() {
    return STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = getCartCount();
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
    renderCartSidebar();
}

function closeCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

function renderCartSidebar() {
    const body = document.getElementById('cartSidebarBody');
    const footer = document.getElementById('cartSidebarFooter');
    if (!body || !footer) return;

    if (STATE.cart.length === 0) {
        body.innerHTML = `
            <div class="cart-empty">
                <div class="empty-icon">🛒</div>
                <h4>Your cart is empty</h4>
                <p>Start shopping to add products</p>
                <button class="btn btn-primary" onclick="closeCart(); navigateTo('shop');">Shop Now</button>
            </div>
        `;
        footer.innerHTML = '';
        return;
    }

    body.innerHTML = STATE.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">${item.emoji}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
            </div>
            <div class="cart-item-controls">
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
                <button class="cart-remove" onclick="removeFromCart('${item.id}')">✕</button>
            </div>
        </div>
    `).join('');

    const subtotal = getCartTotal();
    const shipping = subtotal >= 500 ? 0 : 30;
    const total = subtotal + shipping;

    footer.innerHTML = `
        <div class="cart-summary-row">
            <span>Subtotal</span>
            <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="cart-summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? '🎉 Free' : formatPrice(shipping)}</span>
        </div>
        <div class="cart-summary-row total">
            <span>Total</span>
            <span>${formatPrice(total)}</span>
        </div>
        <div class="cart-actions">
            <button class="btn btn-primary btn-block" onclick="closeCart(); navigateTo('checkout');">
                💳 Checkout
            </button>
            <button class="btn btn-outline btn-block" onclick="closeCart(); navigateTo('cart');">
                View Cart
            </button>
        </div>
    `;
}

function renderCartPage() {
    const container = document.getElementById('cartContent');
    if (!container) return;

    if (STATE.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Start shopping to add products</p>
                <button class="btn btn-primary btn-lg" onclick="navigateTo('shop')">Shop Now</button>
            </div>
        `;
        return;
    }

    const subtotal = getCartTotal();
    const shipping = subtotal >= 500 ? 0 : 30;
    const total = subtotal + shipping;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem;">
            <div class="form-section">
                <h3>🛒 Cart Items (${getCartCount()})</h3>
                ${STATE.cart.map(item => `
                    <div class="cart-item" style="background: var(--bg);">
                        <div class="cart-item-image">${item.emoji}</div>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${escapeHtml(item.name)}</div>
                            <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                        </div>
                        <div class="cart-item-controls">
                            <div class="qty-control">
                                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                            </div>
                            <button class="cart-remove" onclick="removeFromCart('${item.id}')">✕</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-summary">
                <h3>Summary</h3>
                <div class="order-total-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
                <div class="order-total-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                <div class="order-total-row grand"><span>Total</span><span>${formatPrice(total)}</span></div>
                <button class="btn btn-primary btn-block btn-lg" style="margin-top: 1.5rem;" onclick="navigateTo('checkout')">
                    💳 Checkout
                </button>
                <button class="btn btn-outline btn-block" style="margin-top: 0.5rem;" onclick="navigateTo('shop')">
                    Continue Shopping
                </button>
            </div>
        </div>
    `;
}

/* ============ FAVORITES ============ */
function toggleFavorite(productId, btn) {
    const index = STATE.favorites.findIndex(f => f.id === productId);
    const product = MAHA_DATA.PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    if (index >= 0) {
        STATE.favorites.splice(index, 1);
        showToast('💔 Removed from wishlist', 'info');
        if (btn) {
            btn.classList.remove('active');
            btn.textContent = '🤍';
        }
    } else {
        STATE.favorites.push({
            id: product.id,
            name: product.name,
            price: product.price,
            emoji: product.emoji
        });
        showToast('❤️ Added to wishlist', 'success');
        if (btn) {
            btn.classList.add('active');
            btn.textContent = '❤️';
        }
    }

    saveToStorage(KEYS.FAVORITES, STATE.favorites);
    updateFavoritesBadge();
    renderFavoritesPage();
}

function updateFavoritesBadge() {
    const badge = document.getElementById('favBadge');
    if (badge) {
        const count = STATE.favorites.length;
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderFavoritesPage() {
    const container = document.getElementById('favoritesContent');
    if (!container) return;

    if (STATE.favorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💔</div>
                <h3>No favorites yet</h3>
                <p>Click ❤️ on any product to save it</p>
                <button class="btn btn-primary btn-lg" onclick="navigateTo('shop')">Shop Now</button>
            </div>
        `;
        return;
    }

    const products = STATE.favorites
        .map(f => MAHA_DATA.PRODUCTS.find(p => p.id === f.id))
        .filter(Boolean);

    container.innerHTML = `<div class="products-grid">${products.map(renderProductCard).join('')}</div>`;
}

/* ============ GUIDE & BLOG ============ */
function renderGuideArticles() {
    const container = document.getElementById('guideGrid');
    if (!container) return;

    container.innerHTML = MAHA_DATA.GUIDE_ARTICLES.map(article => `
        <article class="article-card" onclick="openArticle('guide', '${article.id}')">
            <div class="article-image">${article.emoji}</div>
            <div class="article-body">
                <div class="article-cat">${article.categoryLabel}</div>
                <h3 class="article-title">${escapeHtml(article.title)}</h3>
                <p class="article-excerpt">${escapeHtml(article.excerpt)}</p>
                <div class="article-footer">
                    <span>⏱️ ${article.readTime} min</span>
                    <span class="read-more">Read More →</span>
                </div>
            </div>
        </article>
    `).join('');
}

function renderBlogArticles() {
    const container = document.getElementById('blogGrid');
    if (!container) return;

    container.innerHTML = MAHA_DATA.BLOG_ARTICLES.map(article => {
        const date = new Date(article.date).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric' 
        });
        return `
            <article class="article-card" onclick="openArticle('blog', '${article.id}')">
                <div class="article-image">${article.emoji}</div>
                <div class="article-body">
                    <div class="article-cat">${article.categoryLabel}</div>
                    <h3 class="article-title">${escapeHtml(article.title)}</h3>
                    <p class="article-excerpt">${escapeHtml(article.excerpt)}</p>
                    <div class="article-footer">
                        <span>${date}</span>
                        <span class="read-more">Read More →</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function openArticle(type, articleId) {
    const articles = type === 'guide' ? MAHA_DATA.GUIDE_ARTICLES : MAHA_DATA.BLOG_ARTICLES;
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    const modal = document.getElementById('searchModal');
    const content = document.querySelector('#searchModal .modal-content');
    if (!modal || !content) return;

    // Use product modal instead
    const productModal = document.getElementById('productModal');
    const productContent = document.getElementById('productModalContent');
    if (!productModal || !productContent) return;

    productContent.innerHTML = `
        <div class="modal-header">
            <h2>${article.emoji} ${escapeHtml(article.title)}</h2>
            <button class="modal-close" onclick="closeModal('productModal')">✕</button>
        </div>
        <div class="article-modal-content">
            ${article.content}
        </div>
    `;

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/* ============ AUTH ============ */


function getUsers() {
    return getFromStorage(KEYS.USERS, []);
}

function saveUsers(users) {
    saveToStorage(KEYS.USERS, users);
}

function handleAccountClick() {
    if (STATE.user) {
        navigateTo('account');
    } else {
        openAuthModal('login');
    }
}

function openAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authTitle');
    const content = document.getElementById('authFormContent');
    if (!modal || !content) return;

    title.textContent = mode === 'login' ? 'Login' : 'Create Account';

    if (mode === 'login') {
        content.innerHTML = `
            <form class="auth-form" onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" class="form-input" id="loginEmail" required placeholder="example@email.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" class="form-input" id="loginPassword" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn btn-primary btn-block btn-lg">Login</button>
                <div style="text-align: center; margin-top: 1rem;">
                    <a href="#" onclick="openAuthModal('register'); return false;" style="color: var(--primary);">
                        Don't have an account? Create one
                    </a>
                </div>
            </form>
        `;
    } else {
        content.innerHTML = `
            <form class="auth-form" onsubmit="handleRegister(event)">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" class="form-input" id="regName" required minlength="3" placeholder="Your name">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" class="form-input" id="regEmail" required placeholder="example@email.com">
                </div>
                <div class="form-group">
                    <label>Phone (optional)</label>
                    <input type="tel" class="form-input" id="regPhone" placeholder="01xxxxxxxxx">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" class="form-input" id="regPassword" required minlength="6" placeholder="At least 6 characters">
                </div>
                <button type="submit" class="btn btn-primary btn-block btn-lg">Create Account</button>
                <div style="text-align: center; margin-top: 1rem;">
                    <a href="#" onclick="openAuthModal('login'); return false;" style="color: var(--primary);">
                        Already have an account? Login
                    </a>
                </div>
            </form>
        `;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        showToast('❌ Email not registered', 'error');
        return;
    }

    if (user.password !== hashPassword(password)) {
        showToast('❌ Incorrect password', 'error');
        return;
    }

    STATE.user = {
        uid: user.uid,
        name: user.name,
        email: user.email,
        roles: user.roles || (getSellerByUserId(user.uid) ? ['customer','seller'] : ['customer']),
        role: user.role || (getSellerByUserId(user.uid) ? 'seller' : 'customer')
    };
    saveToStorage(KEYS.USER, STATE.user);
    persistVeloraUser();
    closeModal('authModal');
    showToast('✅ Welcome back, ' + user.name, 'success');
    updateAccountButton();
    setTimeout(() => navigateTo('account'), 500);
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;

    if (password.length < 6) {
        showToast('❌ Password must be at least 6 characters', 'error');
        return;
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
        showToast('❌ Email already registered', 'error');
        return;
    }

    const user = {
        uid: generateId('user'), name, email, phone, password: hashPassword(password),
        roles: ['customer'], role: 'customer', createdAt: Date.now()
    };

    users.push(user);
    saveUsers(users);

    STATE.user = { uid: user.uid, name: user.name, email: user.email, roles: user.roles || ['customer'], role: user.role || 'customer' };
    saveToStorage(KEYS.USER, STATE.user);
    persistVeloraUser();

    closeModal('authModal');
    showToast('🎉 Account created! Welcome, ' + name, 'success');
    updateAccountButton();
    setTimeout(() => navigateTo('account'), 500);
}

async function logout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        // Sign out from Supabase first
        if (window.mahaSupabase && window.mahaSupabase.auth) {
            const { error } = await window.mahaSupabase.auth.signOut();

            if (error) {
                console.error('❌ Supabase logout failed:', error);
                showToast('❌ Could not logout. Please try again.', 'error');
                return;
            }
        }

        // Clear local UI state
        STATE.user = null;
        localStorage.removeItem(KEYS.USER);

        // Update UI
        updateAccountButton();

        if (typeof updatePlatformSwitcher === 'function') {
            updatePlatformSwitcher();
        }

        showToast('👋 Logged out successfully', 'success');

        setTimeout(() => navigateTo('home'), 500);

    } catch (error) {
        console.error('❌ Logout error:', error);
        showToast('❌ Logout failed. Please try again.', 'error');
    }
}


function updateAccountButton() {
    const btn = document.getElementById('accountBtn');
    if (!btn) return;
    if (STATE.user) {
        btn.textContent = STATE.user.name.charAt(0).toUpperCase();
        btn.title = STATE.user.name;
        btn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
        btn.style.color = '#fff';
        btn.style.fontWeight = '700';
    } else {
        btn.textContent = '👤';
        btn.title = 'Account';
        btn.style.background = '';
        btn.style.color = '';
    }
}

function renderAccountPage() {
    const container = document.getElementById('accountContent');
    if (!container) return;

    if (!STATE.user) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <h3>Not logged in</h3>
                <p>Login or create an account to access your profile</p>
                <button class="btn btn-primary btn-lg" onclick="openAuthModal('login')">Login</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="form-section" style="max-width: 600px; margin: 0 auto;">
            <h3>👤 Profile</h3>
            <div class="form-group" style="margin-bottom: 1rem;">
                <label>Name</label>
                <input type="text" class="form-input" value="${escapeHtml(STATE.user.name)}" readonly>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
                <label>Email</label>
                <input type="email" class="form-input" value="${escapeHtml(STATE.user.email)}" readonly>
            </div>
            <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                <button class="btn btn-outline" style="flex: 1;" onclick="navigateTo('orders')">📦 My Orders</button>
                <button class="btn btn-outline" style="flex: 1;" onclick="navigateTo('favorites')">❤️ Wishlist</button>
            </div>
            <button class="btn btn-primary btn-block" style="margin-top: 0.75rem; background: var(--error);" onclick="logout()">
                Logout
            </button>
        </div>
    `;
}

/* ============ ORDERS ============ */
function getOrders() {
    return getFromStorage('maha_orders', []);
}

function renderOrdersPage() {
    const container = document.getElementById('ordersContent');
    if (!container) return;

    if (!STATE.user) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>Login required</h3>
                <p>Please login to view your orders</p>
                <button class="btn btn-primary btn-lg" onclick="openAuthModal('login')">Login</button>
            </div>
        `;
        return;
    }

    const orders = getOrders();
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No orders yet</h3>
                <p>You haven't placed any orders</p>
                <button class="btn btn-primary btn-lg" onclick="navigateTo('shop')">Shop Now</button>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="form-section" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                    <div style="font-weight: 900; color: var(--primary);">${order.id}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${new Date(order.date).toLocaleDateString('en-US')}</div>
                </div>
                <div style="padding: 0.3rem 0.8rem; background: rgba(76,175,80,0.15); color: var(--success); border-radius: 999px; font-size: 0.8rem; font-weight: 700;">
                    ${order.status || 'Pending'}
                </div>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>${order.items.length} items</span>
                <strong style="color: var(--primary);">${formatPrice(order.total)}</strong>
            </div>
        </div>
    `).join('');
}

/* ============ CHECKOUT ============ */
function renderCheckoutPage() {
    const formContainer = document.getElementById('checkoutForm');
    const summaryContainer = document.getElementById('checkoutSummary');
    if (!formContainer || !summaryContainer) return;

    if (STATE.cart.length === 0) {
        formContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <button class="btn btn-primary" onclick="navigateTo('shop')">Shop Now</button>
            </div>
        `;
        summaryContainer.innerHTML = '';
        return;
    }

    formContainer.innerHTML = `
        <form class="checkout-form" onsubmit="placeOrder(event)">
            <div class="form-section">
                <h3>📋 Shipping Information</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" class="form-input" id="custName" required>
                    </div>
                    <div class="form-group">
                        <label>Phone *</label>
                        <input type="tel" class="form-input" id="custPhone" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" class="form-input" id="custEmail">
                </div>
                <div class="form-row" style="margin-top: 1rem;">
                    <div class="form-group">
                        <label>City *</label>
                        <input type="text" class="form-input" id="custCity" required>
                    </div>
                    <div class="form-group">
                        <label>Address *</label>
                        <input type="text" class="form-input" id="custAddress" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes (optional)</label>
                    <textarea class="form-textarea" id="custNotes"></textarea>
                </div>
            </div>

            <div class="form-section">
                <h3>💳 Payment Method</h3>
                <div class="payment-methods">
                    <div class="payment-method selected" onclick="selectPayment('cod', this)">
                        <div class="payment-radio"></div>
                        <div class="payment-icon">💵</div>
                        <div class="payment-info">
                            <div class="payment-name">Cash on Delivery</div>
                            <div class="payment-desc">Pay when you receive</div>
                        </div>
                    </div>
                    <div class="payment-method" onclick="selectPayment('vodafone', this)">
                        <div class="payment-radio"></div>
                        <div class="payment-icon">📱</div>
                        <div class="payment-info">
                            <div class="payment-name">Vodafone Cash</div>
                            <div class="payment-desc">Transfer via wallet</div>
                        </div>
                    </div>
                    <div class="payment-method" onclick="selectPayment('instapay', this)">
                        <div class="payment-radio"></div>
                        <div class="payment-icon">⚡</div>
                        <div class="payment-info">
                            <div class="payment-name">InstaPay</div>
                            <div class="payment-desc">Instant transfer</div>
                        </div>
                    </div>
                </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg">
                🎉 Place Order
            </button>
        </form>
    `;

    renderCheckoutSummary();
}

function renderCheckoutSummary() {
    const container = document.getElementById('checkoutSummary');
    if (!container) return;

    const subtotal = getCartTotal();
    const shipping = subtotal >= 500 ? 0 : 30;
    const total = subtotal + shipping;

    container.innerHTML = `
        <h3>Summary</h3>
        ${STATE.cart.map(item => `
            <div class="order-item">
                <div class="order-item-emoji">${item.emoji}</div>
                <div class="order-item-info">
                    <div class="order-item-name">${escapeHtml(item.name)}</div>
                    <div class="order-item-qty">Qty: ${item.quantity}</div>
                </div>
                <div class="order-item-price">${formatPrice(item.price * item.quantity)}</div>
            </div>
        `).join('')}
        <div class="order-total-row" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border);">
            <span>Subtotal</span><span>${formatPrice(subtotal)}</span>
        </div>
        <div class="order-total-row">
            <span>Shipping</span><span>${shipping === 0 ? '🎉 Free' : formatPrice(shipping)}</span>
        </div>
        <div class="order-total-row grand">
            <span>Total</span><span>${formatPrice(total)}</span>
        </div>
    `;
}

let selectedPayment = 'cod';

function selectPayment(method, el) {
    selectedPayment = method;
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');
}

function placeOrder(event) {
    event.preventDefault();

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const notes = document.getElementById('custNotes').value.trim();

    if (!name || !phone || !city || !address) {
        showToast('⚠️ Please fill all required fields', 'warning');
        return;
    }

    const subtotal = getCartTotal();
    const shipping = subtotal >= 500 ? 0 : 30;
    const total = subtotal + shipping;

    const order = {
        id: 'ORD-' + Date.now(),
        date: Date.now(),
        items: [...STATE.cart],
        customer: { name, phone, email, city, address, notes },
        payment: selectedPayment,
        subtotal, shipping, total,
        status: 'Pending'
    };

    const orders = getOrders();
    orders.unshift(order);
    saveToStorage('maha_orders', orders);

    // Clear cart
    STATE.cart = [];
    saveToStorage(KEYS.CART, STATE.cart);
    updateCartBadge();

    showToast('🎉 Order placed successfully!', 'success');
    setTimeout(() => navigateTo('orders'), 800);
}

/* ============ SEARCH MODAL ============ */
function openSearch() {
    const modal = document.getElementById('searchModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('modalSearchInput')?.focus(), 100);
    }
}

function handleModalSearch(query) {
    const container = document.getElementById('modalSearchResults');
    if (!container) return;

    if (!query || query.length < 2) {
        container.innerHTML = '';
        return;
    }

    const q = query.toLowerCase();
    const results = MAHA_DATA.PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
    ).slice(0, 8);

    if (results.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No results</div>';
        return;
    }

    container.innerHTML = results.map(p => `
        <div class="compare-item" onclick="closeModal('searchModal'); openProductDetail('${p.id}');">
            <div class="compare-item-emoji">${p.emoji}</div>
            <div class="compare-item-info">
                <div class="compare-item-name">${escapeHtml(p.name)}</div>
                <div class="compare-item-brand">${escapeHtml(p.brand)}</div>
            </div>
            <div class="compare-item-price">${formatPrice(p.price)}</div>
        </div>
    `).join('');
}

/* ============ MODAL HELPERS ============ */
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

/* ============ TOAST ============ */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast show ' + type;

    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/* ============ MISC ============ */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openWhatsApp() {
    const phone = '201001234567';
    const msg = encodeURIComponent('Hello, I want to ask about your products');
    window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
}

function subscribeNewsletter(event) {
    event.preventDefault();
    showToast('✅ Subscribed successfully!', 'success');
    event.target.reset();
}

/* ============ SCROLL LISTENER ============ */
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTop');
    if (btn) {
        if (window.scrollY > 400) btn.classList.add('show');
        else btn.classList.remove('show');
    }
});

/* ============ INIT ============ */

/* ============================================
   SUPABASE AUTH — SESSION INITIALIZATION
   ============================================ */

let __mahaAuthListenerRegistered = false;

async function initializeSupabaseAuth() {
    if (!window.mahaSupabase || !window.mahaSupabase.auth) {
        console.warn('⚠️ initializeSupabaseAuth: Supabase client not available yet.');
        return;
    }

    try {
        const { data, error } = await window.mahaSupabase.auth.getSession();

        if (error) {
            console.error('❌ getSession failed:', error);
        }

        const session = data && data.session;

        // --- No session ---
        if (!session || !session.user) {
            STATE.user = null;
            try { localStorage.removeItem(KEYS.USER); } catch (e) {}
            updateAccountButton();
            if (typeof updatePlatformSwitcher === 'function') {
                updatePlatformSwitcher();
            }
            registerAuthListenerOnce();
            return;
        }

        // --- Session exists ---
        const authUser = session.user;

        let profile = null;
        try {
            const { data: profileData, error: profileError } = await window.mahaSupabase
                .from('users')
                .select('id, name, email, phone, role')
                .eq('id', authUser.id)
                .single();

            if (profileError || !profileData) {
                console.error('❌ Could not load profile from public.users:', profileError);
                STATE.user = null;
                try { localStorage.removeItem(KEYS.USER); } catch (e) {}
                updateAccountButton();
                registerAuthListenerOnce();
                return;
            }
            profile = profileData;
        } catch (e) {
            console.error('❌ Profile load exception:', e);
            STATE.user = null;
            try { localStorage.removeItem(KEYS.USER); } catch (e2) {}
            updateAccountButton();
            registerAuthListenerOnce();
            return;
        }

        // --- Resolve sellerId (best-effort) ---
        let sellerId = null;
        try {
            const { data: sellerRows, error: sellerLookupError } = await window.mahaSupabase
                .rpc('velora_get_own_seller');
             if (sellerLookupError) throw sellerLookupError;
             const sellerRow = Array.isArray(sellerRows) ? sellerRows[0] : sellerRows;

            if (sellerRow && sellerRow.id) {
                sellerId = sellerRow.id;
            }
        } catch (e) {
            sellerId = null;
        }

        const safeRole = (typeof ROLES !== 'undefined' && ROLES && ROLES.CUSTOMER)
            ? (profile.role || ROLES.CUSTOMER)
            : (profile.role || 'customer');

        STATE.user = {
            uid: profile.id,
            name: profile.name || (authUser.user_metadata && authUser.user_metadata.name) || profile.email || authUser.email,
            email: profile.email || authUser.email,
            role: safeRole,
            sellerId: sellerId || null
        };

        try {
            saveToStorage(KEYS.USER, STATE.user);
        } catch (e) {
            console.error('❌ Could not save user state to storage:', e);
        }

        updateAccountButton();
        if (typeof updatePlatformSwitcher === 'function') {
            updatePlatformSwitcher();
        }

        registerAuthListenerOnce();

    } catch (e) {
        console.error('❌ initializeSupabaseAuth failed:', e);
    }
}

function registerAuthListenerOnce() {
    if (__mahaAuthListenerRegistered) return;
    if (!window.mahaSupabase || !window.mahaSupabase.auth) return;

    __mahaAuthListenerRegistered = true;

    window.mahaSupabase.auth.onAuthStateChange(async (event, session) => {
        try {
            if (event === 'SIGNED_OUT') {
                STATE.user = null;
                try { localStorage.removeItem(KEYS.USER); } catch (e) {}
                updateAccountButton();
                if (typeof updatePlatformSwitcher === 'function') {
                    updatePlatformSwitcher();
                }
                return;
            }

            if (
                (event === 'SIGNED_IN' ||
                 event === 'INITIAL_SESSION' ||
                 event === 'TOKEN_REFRESHED') &&
                session &&
                session.user
            ) {
                const authUser = session.user;

                let profile = null;
                try {
                    const { data: profileData } = await window.mahaSupabase
                        .from('users')
                        .select('id, name, email, phone, role')
                        .eq('id', authUser.id)
                        .single();
                    profile = profileData || null;
                } catch (e) {
                    profile = null;
                }

                if (!profile) {
                    // Do not clobber a valid login state because this async listener
                    // lost a race with the explicit login/profile-loading flow.
                    // The login handler already validates profile access and owns
                    // the user-facing failure path.
                    console.warn('⚠️ Supabase auth listener: profile unavailable; preserving current STATE.user.');
                    return;
                }

                let sellerId = null;
                try {
                    const { data: sellerRows, error: sellerLookupError } = await window.mahaSupabase
                        .rpc('velora_get_own_seller');
                    if (sellerLookupError) throw sellerLookupError;
                    const sellerRow = Array.isArray(sellerRows) ? sellerRows[0] : sellerRows;
                    if (sellerRow && sellerRow.id) sellerId = sellerRow.id;
                } catch (e) {
                    sellerId = null;
                }

                const safeRole = (typeof ROLES !== 'undefined' && ROLES && ROLES.CUSTOMER)
                    ? (profile.role || ROLES.CUSTOMER)
                    : (profile.role || 'customer');

                STATE.user = {
                    uid: profile.id,
                    name: profile.name || (authUser.user_metadata && authUser.user_metadata.name) || profile.email || authUser.email,
                    email: profile.email || authUser.email,
                    role: safeRole,
                    sellerId: sellerId || null
                };

                try {
                    saveToStorage(KEYS.USER, STATE.user);
                } catch (e) {}

                updateAccountButton();
                if (typeof updatePlatformSwitcher === 'function') {
                    updatePlatformSwitcher();
                }
            }
        } catch (e) {
            console.error('❌ onAuthStateChange handler error:', e);
        }
    });
}

window.initializeSupabaseAuth = initializeSupabaseAuth;

function initApp() {
    console.log('🚀 Initializing app...');

    // Load theme
    loadTheme();

    // Load cart
    STATE.cart = getFromStorage(KEYS.CART, []);
    updateCartBadge();

    // Load favorites
    STATE.favorites = getFromStorage(KEYS.FAVORITES, []);
    updateFavoritesBadge();

        // Load user (deferred to Supabase Auth)
    updateAccountButton();
    if (window.mahaSupabase && window.mahaSupabase.auth) {
        initializeSupabaseAuth();
    } else {
        let __authInitTries = 0;
        const __authInitTimer = setInterval(() => {
            __authInitTries++;
            if (window.mahaSupabase && window.mahaSupabase.auth) {
                clearInterval(__authInitTimer);
                initializeSupabaseAuth();
            } else if (__authInitTries >= 40) {
                clearInterval(__authInitTimer);
                console.warn('⚠️ Supabase client never became available; auth init skipped.');
            }
        }, 250);
    }

    // Load page from URL
    const hash = window.location.hash.replace('#', '');
    const validPages = ['home', 'shop', 'guide', 'blog', 'compare', 'reviews', 'favorites', 'cart', 'checkout', 'orders', 'account'];
    const startPage = validPages.includes(hash) ? hash : 'home';

    // Navigate to start page
    navigateTo(startPage);

    // Hide loading screen
    setTimeout(() => {
        const loading = document.getElementById('loadingScreen');
        if (loading) loading.classList.add('hidden');
    }, 500);

    console.log('✅ App ready!');
}

// Wait for data to load
if (typeof MAHA_DATA === 'undefined') {
    console.error('❌ MAHA_DATA not loaded!');
} else {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}

/* ============================================
   VELORA - Compare + Reviews
   ============================================ */

console.log('⚖️ Loading compare + reviews...');

/* ============ COMPARE STATE ============ */
let compareList = [];

/* ============ LOAD COMPARE FROM STORAGE ============ */
function loadCompare() {
    compareList = getFromStorage('maha_compare', []);
    if (compareList.length > 0) {
        renderComparePage();
    }
}

function saveCompare() {
    saveToStorage('maha_compare', compareList.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        oldPrice: p.oldPrice,
        emoji: p.emoji,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        subcategory: p.subcategory,
        ingredients: p.ingredients,
        bestFor: p.bestFor,
        skinType: p.skinType,
        pros: p.pros,
        cons: p.cons,
        usage: p.usage
    })));
}

/* ============ RENDER COMPARE PAGE ============ */
function renderComparePage() {
    const selectedContainer = document.getElementById('compareSelected');
    const emptyContainer = document.getElementById('compareEmpty');
    const actionsContainer = document.getElementById('compareActions');
    
    if (!selectedContainer || !emptyContainer || !actionsContainer) return;

    if (compareList.length === 0) {
        selectedContainer.innerHTML = '';
        emptyContainer.style.display = 'block';
        actionsContainer.style.display = 'none';
        return;
    }

    emptyContainer.style.display = 'none';

    selectedContainer.innerHTML = compareList.map(p => `
        <div class="compare-slot">
            <button class="compare-slot-remove" onclick="removeFromCompare('${p.id}')">✕</button>
            <div class="compare-slot-emoji">${p.emoji}</div>
            <div class="compare-slot-name">${escapeHtml(p.name)}</div>
            <div class="compare-slot-price">${formatPrice(p.price)}</div>
        </div>
    `).join('');

    if (compareList.length >= 2) {
        actionsContainer.style.display = 'flex';
        actionsContainer.innerHTML = `
            <button class="btn btn-primary btn-lg" onclick="showCompareTable()">
                ⚖️ Compare Now (${compareList.length} products)
            </button>
            <button class="btn btn-outline" onclick="clearCompare()">
                🗑️ Clear All
            </button>
        `;
    } else {
        actionsContainer.style.display = 'block';
        actionsContainer.innerHTML = `
            <div class="compare-empty" style="border: 1px dashed var(--warning); background: rgba(255,152,0,0.05); padding: 1.5rem;">
                <p style="margin: 0; color: var(--text-muted);">💡 Add at least one more product to compare</p>
            </div>
        `;
    }
}

/* ============ COMPARE SEARCH ============ */
function handleCompareSearch(query) {
    const box = document.getElementById('compareSuggestions');
    if (!box) return;

    if (!query || query.length < 1) {
        box.innerHTML = '';
        box.classList.remove('active');
        return;
    }

    const q = query.toLowerCase();
    const results = MAHA_DATA.PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
    ).slice(0, 8);

    if (results.length === 0) {
        box.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">🔍 No results found</div>';
        box.classList.add('active');
        return;
    }

    box.innerHTML = results.map(p => `
        <div class="compare-item" onclick="addToCompare('${p.id}')">
            <div class="compare-item-emoji">${p.emoji}</div>
            <div class="compare-item-info">
                <div class="compare-item-name">${escapeHtml(p.name)}</div>
                <div class="compare-item-brand">${escapeHtml(p.brand)}</div>
            </div>
            <div class="compare-item-price">${formatPrice(p.price)}</div>
        </div>
    `).join('');

    box.classList.add('active');
}

function quickCompareSearch(query) {
    const input = document.getElementById('compareSearch');
    if (input) {
        input.value = query;
        handleCompareSearch(query);
    }
}

function addToCompare(productId) {
    const product = MAHA_DATA.PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    if (compareList.some(p => p.id === productId)) {
        showToast('⚠️ Product already in comparison', 'warning');
        return;
    }

    if (compareList.length >= 4) {
        showToast('⚠️ Maximum 4 products', 'warning');
        return;
    }

    compareList.push(product);
    saveCompare();
    renderComparePage();

    // Clear search
    const box = document.getElementById('compareSuggestions');
    if (box) box.classList.remove('active');
    const input = document.getElementById('compareSearch');
    if (input) input.value = '';

    showToast('✅ Added to comparison', 'success');
}

function removeFromCompare(productId) {
    compareList = compareList.filter(p => p.id !== productId);
    saveCompare();
    renderComparePage();
    showToast('🗑️ Removed', 'info');
}

function clearCompare() {
    if (!confirm('Clear all products from comparison?')) return;
    compareList = [];
    saveCompare();
    renderComparePage();
    showToast('🗑️ Comparison cleared', 'info');
}

/* ============ COMPARE TABLE ============ */
function showCompareTable() {
    if (compareList.length < 2) {
        showToast('⚠️ Choose at least 2 products', 'warning');
        return;
    }

    const modal = document.getElementById('compareModal');
    const content = document.getElementById('compareModalContent');
    if (!modal || !content) return;

    const rows = [
        { label: '🏷️ Product', key: 'name', format: (v, p) => p.emoji + ' ' + escapeHtml(v) },
        { label: '🏭 Brand', key: 'brand' },
        { label: '💰 Price', key: 'price', format: (v) => `<strong style="color: var(--primary); font-size: 1.05rem;">${formatPrice(v)}</strong>` },
        { label: '⭐ Rating', key: 'rating', format: (v) => renderStars(v) + ' ' + v, best: 'max' },
        { label: '👥 Reviews', key: 'reviewsCount', format: (v) => v + ' reviews', best: 'max' },
        { label: '📂 Category', key: 'subcategory' },
        { label: '🧪 Ingredients', key: 'ingredients', format: (v) => v ? v.join(' • ') : '—' },
        { label: '✨ Best For', key: 'bestFor', format: (v) => v ? v.join(' • ') : '—' },
        { label: '🧴 Skin Type', key: 'skinType', format: (v) => v ? v.join(' • ') : '—' },
        { label: '✅ Pros', key: 'pros', format: (v) => v ? '✅ ' + v.join('<br>✅ ') : '—' },
        { label: '❌ Cons', key: 'cons', format: (v) => v ? '❌ ' + v.join('<br>❌ ') : '—' },
        { label: '💡 Usage', key: 'usage' }
    ];

    let html = '<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th></th>';

    compareList.forEach(p => {
        html += `<th>
            <div class="compare-product-header">
                <div class="emoji">${p.emoji}</div>
                <div>${escapeHtml(p.name)}</div>
            </div>
        </th>`;
    });

    html += '</tr></thead><tbody>';

    rows.forEach(row => {
        html += `<tr><th>${row.label}</th>`;

        let bestId = null;
        if (row.best === 'max') {
            let bestVal = -Infinity;
            compareList.forEach(p => {
                const val = parseFloat(p[row.key]) || 0;
                if (val > bestVal) { bestVal = val; bestId = p.id; }
            });
        }

        compareList.forEach(p => {
            const value = p[row.key];
            const formatted = row.format ? row.format(value, p) : (value || '—');
            const isBest = p.id === bestId;
            html += `<td class="${isBest ? 'best-cell' : ''}">${formatted}</td>`;
        });

        html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Calculate winner
    const scores = compareList.map(p => {
        let score = 0;
        score += (p.rating || 0) * 40;
        score += p.price < 200 ? 30 : p.price < 500 ? 22 : p.price < 1000 ? 15 : 8;
        score += Math.min((p.pros?.length || 0) * 5, 20);
        score += Math.min((p.ingredients?.length || 0) * 2, 10);
        return { product: p, score };
    });
    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0].product;

    html += `
        <div class="winner-box">
            <h3>🏆 Comparison Winner</h3>
            <div class="winner-name">${winner.emoji} ${escapeHtml(winner.name)}</div>
            <div class="winner-sub">Based on rating, price, and features</div>
        </div>
    `;

    content.innerHTML = html;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/* ============ REVIEWS SYSTEM ============ */
function getReviews() {
    return getFromStorage('maha_reviews', []);
}

function saveReviews(reviews) {
    saveToStorage('maha_reviews', reviews);
}

function renderReviewsPage() {
    const container = document.getElementById('reviewsContent');
    if (!container) return;

    const reviews = getReviews();

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="reviews-empty">
                <div class="empty-icon">💬</div>
                <h3>No reviews yet</h3>
                <p>Be the first to share your experience</p>
                <button class="btn btn-primary btn-lg" onclick="navigateTo('shop')">
                    🛍️ Shop and Share Your Experience
                </button>
            </div>
        `;
        return;
    }

    // Calculate stats
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);
    const fiveStars = reviews.filter(r => r.rating === 5).length;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1; margin-bottom: 0.5rem;">${reviews.length}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Total Reviews</div>
            </div>
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1; margin-bottom: 0.5rem;">${avgRating}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Average Rating</div>
            </div>
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; text-align: center;">
                <div style="font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1; margin-bottom: 0.5rem;">${fiveStars}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">5-Star Reviews</div>
            </div>
        </div>

        <div class="reviews-list">
            ${reviews.slice(0, 30).map(r => {
                const product = MAHA_DATA.PRODUCTS.find(p => p.id === r.productId);
                const date = new Date(r.date).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                });
                return `
                    <div class="review-card">
                        <div class="review-header">
                            <div class="review-avatar">${(r.author || 'G').charAt(0).toUpperCase()}</div>
                            <div class="review-author">
                                <strong>${escapeHtml(r.author || 'Guest')}</strong>
                                <div class="review-stars">${renderStars(r.rating)}</div>
                            </div>
                            ${r.verified ? '<span style="padding: 0.25rem 0.6rem; background: rgba(76,175,80,0.15); color: var(--success); border-radius: 999px; font-size: 0.7rem; font-weight: 700;">✅ Verified</span>' : ''}
                        </div>
                        ${product ? `<div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--bg-alt); border-radius: 8px; margin-bottom: 0.75rem; font-size: 0.85rem;"><span>${product.emoji}</span><span>${escapeHtml(product.name)}</span></div>` : ''}
                        ${r.title ? `<h4 style="margin-bottom: 0.5rem; font-size: 1rem;">${escapeHtml(r.title)}</h4>` : ''}
                        <p class="review-text">"${escapeHtml(r.text)}"</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--border);">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">${date}</span>
                            <button onclick="likeReview('${r.id}', this)" style="padding: 0.35rem 0.75rem; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 999px; font-size: 0.8rem; font-family: inherit; cursor: pointer;">
                                👍 ${r.likes || 0}
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function likeReview(reviewId, btn) {
    const reviews = getReviews();
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return;
    reviews[idx].likes = (reviews[idx].likes || 0) + 1;
    saveReviews(reviews);
    if (btn) btn.innerHTML = '👍 ' + reviews[idx].likes;
}

/* ============ WRITE REVIEW ============ */
function openWriteReview(productId) {
    if (!STATE.user) {
        showToast('⚠️ Please login first', 'warning');
        setTimeout(() => openAuthModal('login'), 500);
        return;
    }

    const existing = getReviews().find(r => r.productId === productId && r.userId === STATE.user.uid);
    if (existing) {
        showToast('ℹ️ You already reviewed this product', 'info');
        return;
    }

    let modal = document.getElementById('writeReviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'writeReviewModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    const product = MAHA_DATA.PRODUCTS.find(p => p.id === productId);

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>✍️ Write Review</h2>
                <button class="modal-close" onclick="closeModal('writeReviewModal')">✕</button>
            </div>
            ${product ? `<div style="background: var(--bg-alt); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; font-weight: 700;">${product.emoji} ${escapeHtml(product.name)}</div>` : ''}
            <form onsubmit="submitReview(event, '${productId}')" class="auth-form">
                <div class="form-group">
                    <label>Rating</label>
                    <div id="ratingStars" style="display: flex; gap: 0.35rem; justify-content: center; padding: 0.75rem; background: var(--bg-alt); border-radius: 8px;">
                        ${[1,2,3,4,5].map(i => `<span onclick="setRating(${i})" data-rating="${i}" style="font-size: 2rem; cursor: pointer; filter: grayscale(100%); opacity: 0.3; transition: all 0.2s;">⭐</span>`).join('')}
                    </div>
                    <input type="hidden" id="reviewRating" value="5">
                </div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" class="form-input" id="reviewTitle" placeholder="Summary" maxlength="100">
                </div>
                <div class="form-group">
                    <label>Review</label>
                    <textarea class="form-textarea" id="reviewText" required rows="4" placeholder="Share your experience..." maxlength="1000"></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-block btn-lg">Publish Review</button>
            </form>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => setRating(5), 100);
}

function setRating(rating) {
    const stars = document.querySelectorAll('#ratingStars span');
    stars.forEach((s, i) => {
        if (i < rating) {
            s.style.filter = 'grayscale(0%)';
            s.style.opacity = '1';
            s.style.transform = 'scale(1.1)';
        } else {
            s.style.filter = 'grayscale(100%)';
            s.style.opacity = '0.3';
            s.style.transform = 'scale(1)';
        }
    });
    const input = document.getElementById('reviewRating');
    if (input) input.value = rating;
}

function submitReview(event, productId) {
    event.preventDefault();
    if (!STATE.user) return;

    const rating = parseInt(document.getElementById('reviewRating').value) || 5;
    const title = document.getElementById('reviewTitle').value.trim();
    const text = document.getElementById('reviewText').value.trim();

    if (!text || text.length < 5) {
        showToast('⚠️ Please write at least 5 characters', 'warning');
        return;
    }

    const reviews = getReviews();
    const review = {
        id: generateId('rev'),
        productId: productId,
        userId: STATE.user.uid,
        author: STATE.user.name,
        rating: rating,
        title: title,
        text: text,
        likes: 0,
        verified: true,
        date: Date.now()
    };

    reviews.unshift(review);
    saveReviews(reviews);

    closeModal('writeReviewModal');
    showToast('🎉 Review published! Thanks!', 'success');
}

/* ============ LOAD COMPARE ON START ============ */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadCompare, 800);
});

console.log('✅ Compare + Reviews loaded!');

/* ============================================
   VELORA - Advanced Features
   ============================================ */

console.log('🎁 Loading advanced features...');

/* ============ COUPONS ============ */
/* Earlier coupon implementation removed during root consolidation; the later canonical coupon implementation is retained. */
const COUPONS = {
    'WELCOME20': {
        code: 'WELCOME20',
        type: 'percent',
        value: 20,
        minPurchase: 200,
        maxDiscount: 500,
        description: '20% off for new customers',
        forFirstOrder: true,
        active: false
    },
    'MAHA50': {
        code: 'MAHA50',
        type: 'fixed',
        value: 50,
        minPurchase: 300,
        description: 'EGP 50 off orders above 300',
        active: false
    },
    'FREESHIP': {
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        minPurchase: 200,
        description: 'Free shipping on orders above 200',
        active: false
    },
    'SUMMER30': {
        code: 'SUMMER30',
        type: 'percent',
        value: 30,
        minPurchase: 500,
        maxDiscount: 800,
        description: '30% off summer sale',
        active: false
    },
    'VIP15': {
        code: 'VIP15',
        type: 'percent',
        value: 15,
        minPurchase: 100,
        maxDiscount: 300,
        description: 'VIP 15% discount',
        active: false
    }
};

let appliedCoupon = null;

/* ============ APPLY COUPON ============ */
function applyCoupon() {
    const input = document.getElementById('couponInput');
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    if (!code) {
        showToast('⚠️ Please enter a coupon code', 'warning');
        return;
    }

    const coupon = COUPONS[code];
    if (!coupon || !coupon.active) {
        showToast('❌ Invalid coupon code', 'error');
        return;
    }

    const subtotal = getCartTotal();
    if (subtotal < coupon.minPurchase) {
        showToast('⚠️ Minimum purchase: ' + formatPrice(coupon.minPurchase), 'warning');
        return;
    }

    appliedCoupon = coupon;
    saveToStorage('maha_coupon', coupon);
    showToast('🎉 Coupon applied: ' + coupon.description, 'success');

    renderCartSidebar();
    renderCartPage();
    renderCheckoutSummary();
}

function removeCoupon() {
    appliedCoupon = null;
    localStorage.removeItem('maha_coupon');
    showToast('🗑️ Coupon removed', 'info');
    renderCartSidebar();
    renderCartPage();
    renderCheckoutSummary();
}

function loadCoupon() {
    const saved = getFromStorage('maha_coupon', null);
    const code = String(saved?.code || '').toUpperCase();
    appliedCoupon = COUPONS[code]?.active ? COUPONS[code] : null;
    if (!appliedCoupon) localStorage.removeItem('maha_coupon');
}

/* ============ CALCULATE DISCOUNT ============ */
function calculateDiscount() {
    if (!appliedCoupon) return 0;

    const subtotal = getCartTotal();
    if (appliedCoupon.type === 'percent') {
        let discount = (subtotal * appliedCoupon.value) / 100;
        if (appliedCoupon.maxDiscount) {
            discount = Math.min(discount, appliedCoupon.maxDiscount);
        }
        return Math.round(discount);
    }
    if (appliedCoupon.type === 'fixed') {
        return Math.min(appliedCoupon.value, subtotal);
    }
    if (appliedCoupon.type === 'free_shipping') {
        return 30;
    }
    return 0;
}

/* ============ OVERRIDE CART TOTAL ============ */
const originalGetCartTotal = getCartTotal;
function getCartTotalWithDiscount() {
    const subtotal = originalGetCartTotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
}

/* ============ OVERRIDE renderCartSidebar ============ */
const originalRenderCartSidebar = renderCartSidebar;
renderCartSidebar = function() {
    const body = document.getElementById('cartSidebarBody');
    const footer = document.getElementById('cartSidebarFooter');
    if (!body || !footer) return;

    if (STATE.cart.length === 0) {
        body.innerHTML = `
            <div class="cart-empty">
                <div class="empty-icon">🛒</div>
                <h4>Your cart is empty</h4>
                <p>Start shopping to add products</p>
                <button class="btn btn-primary" onclick="closeCart(); navigateTo('shop');">Shop Now</button>
            </div>
        `;
        footer.innerHTML = '';
        return;
    }

    body.innerHTML = STATE.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">${item.emoji}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
            </div>
            <div class="cart-item-controls">
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
                <button class="cart-remove" onclick="removeFromCart('${item.id}')">✕</button>
            </div>
        </div>
    `).join('');

    const subtotal = getCartTotal();
    const discount = calculateDiscount();
    const shipping = (subtotal - discount) >= 500 ? 0 : 30;
    const total = Math.max(0, subtotal - discount) + shipping;

    // Coupon section
    let couponHtml = '';
    if (appliedCoupon) {
        couponHtml = `
            <div class="coupon-applied">
                <span>🎟️ ${appliedCoupon.code}</span>
                <button onclick="removeCoupon()">✕</button>
            </div>
        `;
    } else {
        couponHtml = `
            <div class="coupon-box">
                <input type="text" class="coupon-input" id="couponInput" placeholder="Coupon code" onkeypress="if(event.key==='Enter'){event.preventDefault();applyCoupon();}">
                <button class="coupon-btn" onclick="applyCoupon()">Apply</button>
            </div>
        `;
    }

    footer.innerHTML = `
        ${couponHtml}
        <div class="cart-summary-row">
            <span>Subtotal</span>
            <span>${formatPrice(subtotal)}</span>
        </div>
        ${discount > 0 ? `
            <div class="cart-summary-row" style="color: var(--success);">
                <span>Discount</span>
                <span>-${formatPrice(discount)}</span>
            </div>
        ` : ''}
        <div class="cart-summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? '🎉 Free' : formatPrice(shipping)}</span>
        </div>
        <div class="cart-summary-row total">
            <span>Total</span>
            <span>${formatPrice(total)}</span>
        </div>
        <div class="cart-actions">
            <button class="btn btn-primary btn-block" onclick="closeCart(); navigateTo('checkout');">
                💳 Checkout
            </button>
            <button class="btn btn-outline btn-block" onclick="closeCart(); navigateTo('cart');">
                View Cart
            </button>
        </div>
    `;
};

/* ============ OVERRIDE renderCartPage ============ */
const originalRenderCartPage = renderCartPage;
renderCartPage = function() {
    const container = document.getElementById('cartContent');
    if (!container) return;

    if (STATE.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Start shopping to add products</p>
                <button class="btn btn-primary btn-lg" onclick="navigateTo('shop')">Shop Now</button>
            </div>
        `;
        return;
    }

    const subtotal = getCartTotal();
    const discount = calculateDiscount();
    const shipping = (subtotal - discount) >= 500 ? 0 : 30;
    const total = Math.max(0, subtotal - discount) + shipping;

    let couponHtml = '';
    if (appliedCoupon) {
        couponHtml = `
            <div class="coupon-applied">
                <span>🎟️ ${appliedCoupon.code}</span>
                <button onclick="removeCoupon()">✕</button>
            </div>
        `;
    } else {
        couponHtml = `
            <div class="coupon-box">
                <input type="text" class="coupon-input" id="couponInput" placeholder="Coupon code" onkeypress="if(event.key==='Enter'){event.preventDefault();applyCoupon();}">
                <button class="coupon-btn" onclick="applyCoupon()">Apply</button>
            </div>
        `;
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem;">
            <div class="form-section">
                <h3>🛒 Cart Items (${getCartCount()})</h3>
                ${STATE.cart.map(item => `
                    <div class="cart-item" style="background: var(--bg);">
                        <div class="cart-item-image">${item.emoji}</div>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${escapeHtml(item.name)}</div>
                            <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                        </div>
                        <div class="cart-item-controls">
                            <div class="qty-control">
                                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                            </div>
                            <button class="cart-remove" onclick="removeFromCart('${item.id}')">✕</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-summary">
                <h3>Summary</h3>
                ${couponHtml}
                <div class="order-total-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
                ${discount > 0 ? `<div class="order-total-row" style="color: var(--success); font-weight: 700;"><span>Discount</span><span>-${formatPrice(discount)}</span></div>` : ''}
                <div class="order-total-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                <div class="order-total-row grand"><span>Total</span><span>${formatPrice(total)}</span></div>
                <button class="btn btn-primary btn-block btn-lg" style="margin-top: 1.5rem;" onclick="navigateTo('checkout')">
                    💳 Checkout
                </button>
                <button class="btn btn-outline btn-block" style="margin-top: 0.5rem;" onclick="navigateTo('shop')">
                    Continue Shopping
                </button>
            </div>
        </div>
    `;
};

/* ============ OVERRIDE renderCheckoutSummary ============ */
const originalRenderCheckoutSummary = renderCheckoutSummary;
renderCheckoutSummary = function() {
    const container = document.getElementById('checkoutSummary');
    if (!container) return;

    const subtotal = getCartTotal();
    const discount = calculateDiscount();
    const shipping = (subtotal - discount) >= 500 ? 0 : 30;
    const total = Math.max(0, subtotal - discount) + shipping;

    container.innerHTML = `
        <h3>Summary</h3>
        ${STATE.cart.map(item => `
            <div class="order-item">
                <div class="order-item-emoji">${item.emoji}</div>
                <div class="order-item-info">
                    <div class="order-item-name">${escapeHtml(item.name)}</div>
                    <div class="order-item-qty">Qty: ${item.quantity}</div>
                </div>
                <div class="order-item-price">${formatPrice(item.price * item.quantity)}</div>
            </div>
        `).join('')}
        ${appliedCoupon ? `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; color: var(--success); font-weight: 700;"><span>🎟️ ${appliedCoupon.code}</span><span>-${formatPrice(discount)}</span></div>` : ''}
        <div class="order-total-row" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border);">
            <span>Subtotal</span><span>${formatPrice(subtotal)}</span>
        </div>
        ${discount > 0 ? `<div class="order-total-row" style="color: var(--success); font-weight: 700;"><span>Discount</span><span>-${formatPrice(discount)}</span></div>` : ''}
        <div class="order-total-row">
            <span>Shipping</span><span>${shipping === 0 ? '🎉 Free' : formatPrice(shipping)}</span>
        </div>
        <div class="order-total-row grand">
            <span>Total</span><span>${formatPrice(total)}</span>
        </div>
    `;
};

/* ============ FLASH SALE ============ */
const FLASH_SALE = {
    active: false,
    discount: 30,
    endsAt: (() => { try { const k = 'velora_flash_sale_ends_at'; const saved = Number(localStorage.getItem(k)); if (saved && saved > Date.now()) return saved; const next = Date.now() + (48 * 60 * 60 * 1000); localStorage.setItem(k, String(next)); return next; } catch (e) { return Date.now() + (48 * 60 * 60 * 1000); } })(), // persistent 48-hour countdown
    label: '🔥 Velora Deals — Limited-Time Offers',
    sublabel: 'new offers from stores across Velora'
};

function renderFlashSaleBanner() {
    if (!FLASH_SALE.active) return;
    if (document.getElementById('flashSaleBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'flashSaleBanner';
    banner.className = 'flash-sale-banner';
    banner.innerHTML = `
        <div class="flash-sale-inner">
            <span class="flash-sale-icon">⚡</span>
            <span class="flash-sale-title">${FLASH_SALE.label}</span>
            <span class="flash-sale-sub">${FLASH_SALE.sublabel}</span>
            <div class="flash-sale-timer" id="flashTimer">
                <span class="flash-time" data-t="h">00</span>:
                <span class="flash-time" data-t="m">00</span>:
                <span class="flash-time" data-t="s">00</span>
            </div>
        </div>
    `;

    const header = document.querySelector('header');
    if (header && header.parentNode) {
        header.parentNode.insertBefore(banner, header);
    } else {
        document.body.insertBefore(banner, document.body.firstChild);
    }

    updateFlashTimer();
    if (window.__veloraFlashTimerInterval) clearInterval(window.__veloraFlashTimerInterval);
    window.__veloraFlashTimerInterval = setInterval(updateFlashTimer, 1000);
}

function updateFlashTimer() {
    const remaining = FLASH_SALE.endsAt - Date.now();
    const timer = document.getElementById('flashTimer');
    if (!timer) return;

    if (remaining <= 0) {
        timer.innerHTML = '<span class="flash-time">ENDED</span>';
        return;
    }

    const h = Math.floor(remaining / (1000 * 60 * 60));
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((remaining % (1000 * 60)) / 1000);

    const hEl = timer.querySelector('[data-t="h"]');
    const mEl = timer.querySelector('[data-t="m"]');
    const sEl = timer.querySelector('[data-t="s"]');

    if (hEl) hEl.textContent = String(h).padStart(2, '0');
    if (mEl) mEl.textContent = String(m).padStart(2, '0');
    if (sEl) sEl.textContent = String(s).padStart(2, '0');
}

/* ============ FIRST ORDER BANNER ============ */
function renderFirstOrderBanner() {
    // Staging/browser-E2E must not advertise unverified promotions.
    return;
}
function copyFirstOrderCode() {
    if (navigator.clipboard) {
        navigator.clipboard.writeText('WELCOME20').then(() => {
            showToast('📋 Code copied: WELCOME20', 'success');
        }).catch(() => {
            showToast('Code: WELCOME20', 'info');
        });
    } else {
        showToast('Code: WELCOME20', 'info');
    }
}

function dismissFirstOrder() {
    if (STATE.user) {
        saveToStorage('first_order_dismissed_' + STATE.user.uid, true);
    }
    const banner = document.getElementById('firstOrderBanner');
    if (banner) banner.remove();
}

/* ============ PWA ============ */
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showPWABanner();
});

function showPWABanner() {
    if (document.getElementById('pwaBanner')) return;
    if (getFromStorage('pwa_dismissed', false)) return;

    const banner = document.createElement('div');
    banner.id = 'pwaBanner';
    banner.className = 'pwa-banner';
    banner.innerHTML = `
        <span class="pwa-icon">📱</span>
        <div class="pwa-text">
            <strong>Install Velora</strong>
            <span>Quick access from your home screen</span>
        </div>
        <button class="pwa-btn" onclick="installPWA()">Install</button>
        <button class="pwa-close" onclick="dismissPWA()">✕</button>
    `;

    document.body.appendChild(banner);
    setTimeout(() => banner.classList.add('show'), 100);
}

function installPWA() {
    if (!deferredPrompt) {
        showToast('ℹ️ Install available after uploading to internet', 'info');
        return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
            showToast('🎉 App installed!', 'success');
        }
        deferredPrompt = null;
        const banner = document.getElementById('pwaBanner');
        if (banner) banner.remove();
    });
}

function dismissPWA() {
    saveToStorage('pwa_dismissed', true);
    const banner = document.getElementById('pwaBanner');
    if (banner) banner.remove();
}

/* ============ IMPROVED TOAST ============ */
const originalShowToast = showToast;
showToast = function(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <span class="toast-text">${message}</span>
    `;
    toast.className = 'toast show ' + type;

    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
};

/* ============ INIT ============ */
function initOffers() {
    console.log('🎁 Initializing offers...');

    // Load coupon
    loadCoupon();

    // Render flash sale
    setTimeout(renderFlashSaleBanner, 800);

    // Render first order banner
    setTimeout(renderFirstOrderBanner, 1500);

    console.log('✅ Offers ready!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOffers);
} else {
    initOffers();
}

console.log('✅ Offers system loaded!');

/* ============================================
   VELORA V5 - Roles + Auth System
   ============================================ */

console.log('👥 Loading roles system...');

/* ============ ROLES ============ */
const ROLES = {
    CUSTOMER: 'customer',
    SELLER: 'seller',
    ADMIN: 'admin',
    OWNER: 'owner'
};

const ROLE_INFO = {
    [ROLES.CUSTOMER]: { label: 'Customer', icon: '👤', color: '#d4708a' },
    [ROLES.SELLER]: { label: 'Seller', icon: '🏪', color: '#4caf50' },
    [ROLES.ADMIN]: { label: 'Admin', icon: '⚙️', color: '#2196f3' },
    [ROLES.OWNER]: { label: 'Platform Owner', icon: '👑', color: '#b8860b' }
};

/* ============ SELLER STATUS ============ */
const SELLER_STATUS = {
    PENDING: 'pending',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
};

const SELLER_STATUS_INFO = {
    [SELLER_STATUS.PENDING]: { label: 'Pending Approval', icon: '⏳', color: '#ff9800' },
    [SELLER_STATUS.UNDER_REVIEW]: { label: 'Under Review', icon: '🔍', color: '#2196f3' },
    [SELLER_STATUS.APPROVED]: { label: 'Approved', icon: '✅', color: '#4caf50' },
    [SELLER_STATUS.REJECTED]: { label: 'Rejected', icon: '❌', color: '#f44336' },
    [SELLER_STATUS.SUSPENDED]: { label: 'Suspended', icon: '🚫', color: '#9c27b0' }
};

/* ============ SUBSCRIPTION PLANS ============ */
const VELORA_PRODUCT_CATEGORIES = [
 {id:'electronics',name:'Electronics & Technology',emoji:'📱',subcategories:['Phones & Tablets','Computers & Laptops','TV & Audio','Cameras','Wearables','Smart Home','Accessories']},
 {id:'fashion',name:'Fashion & Clothing',emoji:'👗',subcategories:['Women','Men','Kids','Shoes','Bags','Jewelry','Accessories']},
 {id:'beauty',name:'Beauty & Personal Care',emoji:'✨',subcategories:['Skincare','Makeup','Hair Care','Fragrance','Bath & Body','Tools']},
 {id:'home',name:'Home & Kitchen',emoji:'🏠',subcategories:['Furniture','Kitchen','Home Decor','Lighting','Bedding','Storage','Appliances']},
 {id:'grocery',name:'Food & Grocery',emoji:'🛒',subcategories:['Pantry','Beverages','Snacks','Fresh Food','Organic','Specialty Food']},
 {id:'health',name:'Health & Wellness',emoji:'🩺',subcategories:['Fitness','Personal Care','Wellness','Medical Supplies','Mobility']},
 {id:'sports',name:'Sports & Outdoors',emoji:'⚽',subcategories:['Fitness','Running','Football','Cycling','Camping','Outdoor Recreation']},
 {id:'toys',name:'Toys, Games & Hobbies',emoji:'🧸',subcategories:['Toys','Board Games','Puzzles','Hobbies','Collectibles']},
 {id:'automotive',name:'Automotive',emoji:'🚗',subcategories:['Car Accessories','Parts','Tools','Motorcycle','Care & Cleaning']},
 {id:'books',name:'Books, Media & Education',emoji:'📚',subcategories:['Books','eBooks','Music','Movies','Educational','Stationery']},
 {id:'pets',name:'Pet Supplies',emoji:'🐾',subcategories:['Dogs','Cats','Birds','Fish','Pet Care','Accessories']},
 {id:'office',name:'Office & Business',emoji:'💼',subcategories:['Office Supplies','Printers','Furniture','Business Equipment','Stationery']},
 {id:'baby',name:'Baby & Kids',emoji:'👶',subcategories:['Baby Clothing','Feeding','Nursery','Toys','Strollers','Safety']},
 {id:'garden',name:'Garden & Outdoors',emoji:'🌿',subcategories:['Plants','Gardening Tools','Outdoor Furniture','Grills','Pools']},
 {id:'gaming',name:'Gaming',emoji:'🎮',subcategories:['Consoles','Games','Controllers','PC Gaming','Collectibles']},
 {id:'jewelry',name:'Jewelry & Watches',emoji:'💎',subcategories:['Fine Jewelry','Fashion Jewelry','Watches','Accessories','Gifts']},
 {id:'digital',name:'Digital Products',emoji:'💻',subcategories:['Software','Templates','Courses','Subscriptions','Downloads']},
 {id:'services',name:'Services',emoji:'🛠️',subcategories:['Professional','Home Services','Creative','Education','Business']},
 {id:'other',name:'Other',emoji:'📦',subcategories:['General']}
];
const VELORA_CATEGORY_MAP = Object.fromEntries(VELORA_PRODUCT_CATEGORIES.map(c => [c.id, c]));

/* ============================================================
   VELORA CORE — SINGLE SOURCE OF TRUTH FACADE
   Identity, global preferences, store settings and subscriptions
   ============================================================ */
const VELORA_CORE = Object.freeze({
  version: '2.0.0',
  currencies: VELORA_CURRENCY_META,
  categories: VELORA_PRODUCT_CATEGORIES,
  languages: Object.freeze({
    en:{name:'English',locale:'en-US',dir:'ltr'},
    es:{name:'Español',locale:'es-ES',dir:'ltr'},
    ar:{name:'العربية',locale:'ar-EG',dir:'rtl'},
    fr:{name:'Français',locale:'fr-FR',dir:'ltr'},
    de:{name:'Deutsch',locale:'de-DE',dir:'ltr'},
    it:{name:'Italiano',locale:'it-IT',dir:'ltr'},
    pt:{name:'Português',locale:'pt-PT',dir:'ltr'},
    tr:{name:'Türkçe',locale:'tr-TR',dir:'ltr'},
    zh:{name:'中文',locale:'zh-CN',dir:'ltr'},
    ja:{name:'日本語',locale:'ja-JP',dir:'ltr'},
    ko:{name:'한국어',locale:'ko-KR',dir:'ltr'},
    hi:{name:'हिन्दी',locale:'hi-IN',dir:'ltr'}
  })
});
window.VELORA_CORE=VELORA_CORE;

function getVeloraCurrentUser(){ return STATE.user || getFromStorage(KEYS.USER,null); }
function getVeloraUserRoles(){
  const user=getVeloraCurrentUser(); if(!user) return [];
  const roles=new Set(Array.isArray(user.roles)?user.roles:[]);
  if(user.role) roles.add(user.role);
  roles.add(ROLES.CUSTOMER);
  if(getSellerByUserId(user.uid)) roles.add(ROLES.SELLER);
  return [...roles];
}
function persistVeloraUser(){
  const user=getVeloraCurrentUser(); if(!user) return null;
  user.roles=getVeloraUserRoles();
  user.role=user.roles.includes(ROLES.OWNER)?ROLES.OWNER:user.roles.includes(ROLES.ADMIN)?ROLES.ADMIN:user.roles.includes(ROLES.SELLER)?ROLES.SELLER:ROLES.CUSTOMER;
  STATE.user=user; saveToStorage(KEYS.USER,user);
  const users=getUsers(); const i=users.findIndex(u=>u.uid===user.uid);
  if(i>=0){users[i]={...users[i],roles:user.roles,role:user.role,sellerId:user.sellerId||getSellerByUserId(user.uid)?.id||null};saveUsers(users);}
  return user;
}
function getVeloraLanguage(){ const code=getFromStorage('velora_language',null); return VELORA_CORE.languages[code]?code: String(navigator.language||'en').slice(0,2).toLowerCase() in VELORA_CORE.languages ? String(navigator.language||'en').slice(0,2).toLowerCase() : 'en'; }
function setVeloraLanguage(code){
  if(!VELORA_CORE.languages[code]) return false;
  saveToStorage('velora_language',code);
  document.documentElement.lang=code;
  document.documentElement.dir=VELORA_CORE.languages[code].dir;
  const el=document.getElementById('languageSelect'); if(el) el.value=code;
  try { window.dispatchEvent(new CustomEvent('velora:languagechange',{detail:{code}})); } catch(_) {}
  return true;
}


/* VELORA I18N V4 — FULL UI LOCALIZATION */
(function(){
'use strict';
const PACK={"en":{"20% off with code":"20% off with code","Account":"Account","Actions":"Actions","Add to Cart":"Add to Cart","All Products":"All Products","All rights reserved.":"All rights reserved.","Apply":"Apply","Back":"Back","Beauty":"Beauty","Become a Seller":"Become a Seller","Blog":"Blog","Build your store. Reach more customers.":"Build your store. Reach more customers.","Buy Now":"Buy Now","Cancel":"Cancel","Cart":"Cart","Categories":"Categories","Checkout":"Checkout","Choose any number of products and compare them in all details":"Choose any number of products and compare them in all details","Clear":"Clear","Close":"Close","Compare":"Compare","Complete Guide":"Complete Guide","Complete your order":"Complete your order","Confirm":"Confirm","Contact Us":"Contact Us","Continue":"Continue","Continue Shopping":"Continue Shopping","Copy Code":"Copy Code","Customer":"Customer","Customer Service":"Customer Service","Deals":"Deals","Delete":"Delete","Discount":"Discount","Discover More.":"Discover More.","Discover independent sellers and growing brands in one marketplace.":"Discover independent sellers and growing brands in one marketplace.","Electronics":"Electronics","Enforced":"Enforced","Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.":"Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.","Explore Velora":"Explore Velora","Explore everything":"Explore everything","Explore popular products and marketplace offers from stores you can trust.":"Explore popular products and marketplace offers from stores you can trust.","Explore products across multiple categories and growing stores.":"Explore products across multiple categories and growing stores.","FAQ":"FAQ","Fashion":"Fashion","Featured":"Featured","Featured Products":"Featured Products","Filters":"Filters","First Order Gift!":"First Order Gift!","Flash Sale":"Flash Sale","For your space":"For your space","Guide":"Guide","Home":"Home","Home & Living":"Home & Living","How to shop, sell, manage orders, and get the most from Velora.":"How to shop, sell, manage orders, and get the most from Velora.","Language":"Language","Limited-Time Offers":"Limited-Time Offers","Login":"Login","Manage your profile and preferences":"Manage your profile and preferences","Marketplace Categories":"Marketplace Categories","Marketplace stories, shopping tips, and seller insights.":"Marketplace stories, shopping tips, and seller insights.","Move & play":"Move & play","My Account":"My Account","My Orders":"My Orders","My Wishlist":"My Wishlist","Name (A-Z)":"Name (A-Z)","Newsletter":"Newsletter","No consent → contextual mode":"No consent → contextual mode","No orders yet":"No orders yet","No results":"No results","Open Your Store":"Open Your Store","Orders":"Orders","Payment":"Payment","Phones & tech":"Phones & tech","Popular on Velora":"Popular on Velora","Powered":"Powered","Price: High to Low":"Price: High to Low","Price: Low to High":"Price: Low to High","Product":"Product","Products":"Products","Products you loved are saved here":"Products you loved are saved here","Quick Links":"Quick Links","Read real experiences and share yours":"Read real experiences and share yours","Ready.":"Ready.","Real Reviews":"Real Reviews","Register":"Register","Remove":"Remove","Required":"Required","Restricted":"Restricted","Return Policy":"Return Policy","Review your items and proceed to checkout":"Review your items and proceed to checkout","Save":"Save","Search":"Search","Search for a product above and add it":"Search for a product above and add it","Sell on Velora":"Sell on Velora","Seller":"Seller","Shipping":"Shipping","Shipping Policy":"Shipping Policy","Shop":"Shop","Shop Better.":"Shop Better.","Shop Now":"Shop Now","Shop What You Love":"Shop What You Love","Shopping Cart":"Shopping Cart","Shops":"Shops","Shops on Velora":"Shops on Velora","Skincare & more":"Skincare & more","Smart Comparison":"Smart Comparison","Sports":"Sports","Start Comparison":"Start Comparison","Start Shopping":"Start Shopping","Start shopping to add products":"Start shopping to add products","Status":"Status","Style & accessories":"Style & accessories","Subscribe":"Subscribe","Subscribe for latest offers":"Subscribe for latest offers","Subtotal":"Subtotal","Theme":"Theme","Top Rated":"Top Rated","Total":"Total","Track your orders":"Track your orders","Tracked":"Tracked","Trending Now":"Trending Now","Try different keywords":"Try different keywords","Velora Deals":"Velora Deals","Velora brings products, sellers, discovery and shopping together in one growing marketplace.":"Velora brings products, sellers, discovery and shopping together in one growing marketplace.","Velora is built for every kind of store — not just one category.":"Velora is built for every kind of store — not just one category.","View All Products":"View All Products","View Details":"View Details","Wishlist":"Wishlist","You haven't placed any orders":"You haven't placed any orders","Your cart is empty":"Your cart is empty","on selected products":"on selected products","products":"products"},"es":{"Home":"Inicio","Categories":"Categorías","Shops":"Tiendas","Deals":"Ofertas","Sell on Velora":"Vender en Velora","Wishlist":"Favoritos","Orders":"Pedidos","Cart":"Carrito","Account":"Cuenta","Theme":"Tema","Language":"Idioma","Search":"Buscar","Shopping Cart":"Carrito","Discover More.":"Descubre más.","Shop Better.":"Compra mejor.","Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.":"Todo lo que necesitas, de tiendas en las que puedes confiar. Explora productos, descubre nuevos vendedores y compra de forma más inteligente, todo en un mismo marketplace.","Start Shopping":"Empezar a comprar","Become a Seller":"Conviértete en vendedor","Products":"Productos","Seller":"Vendedor","Powered":"Impulsado","Marketplace Categories":"Categorías del marketplace","Explore Velora":"Explora Velora","Shop What You Love":"Compra lo que te gusta","Velora is built for every kind of store — not just one category.":"Velora está creada para todo tipo de tiendas, no solo para una categoría.","All Products":"Todos los productos","Explore everything":"Explora todo","Electronics":"Electrónica","Phones & tech":"Móviles y tecnología","Fashion":"Moda","Style & accessories":"Estilo y accesorios","Beauty":"Belleza","Skincare & more":"Cuidado de la piel y más","Home & Living":"Hogar y vida","For your space":"Para tu espacio","Sports":"Deportes","Move & play":"Muévete y juega","Featured Products":"Productos destacados","Trending Now":"Tendencias","Popular on Velora":"Popular en Velora","View All Products":"Ver todos los productos","Build your store. Reach more customers.":"Construye tu tienda. Llega a más clientes.","Velora brings products, sellers, discovery and shopping together in one growing marketplace.":"Velora reúne productos, vendedores, descubrimiento y compras en un marketplace en crecimiento.","Open Your Store":"Abre tu tienda","Explore products across multiple categories and growing stores.":"Explora productos de varias categorías y tiendas en crecimiento.","Filters":"Filtros","Featured":"Destacados","Price: Low to High":"Precio: de menor a mayor","Price: High to Low":"Precio: de mayor a menor","Top Rated":"Mejor valorados","Name (A-Z)":"Nombre (A-Z)","products":"productos","Discover independent sellers and growing brands in one marketplace.":"Descubre vendedores independientes y marcas en crecimiento en un solo marketplace.","Shops on Velora":"Tiendas en Velora","Velora Deals":"Ofertas de Velora","Explore popular products and marketplace offers from stores you can trust.":"Explora productos populares y ofertas del marketplace de tiendas en las que puedes confiar.","Complete Guide":"Guía completa","How to shop, sell, manage orders, and get the most from Velora.":"Cómo comprar, vender, gestionar pedidos y aprovechar Velora al máximo.","Blog":"Blog","Marketplace stories, shopping tips, and seller insights.":"Historias del marketplace, consejos de compra y novedades para vendedores.","Smart Comparison":"Comparación inteligente","Choose any number of products and compare them in all details":"Elige varios productos y compáralos en todos sus detalles","Start Comparison":"Iniciar comparación","Search for a product above and add it":"Busca un producto arriba y añádelo","Real Reviews":"Opiniones reales","Read real experiences and share yours":"Lee experiencias reales y comparte la tuya","My Wishlist":"Mi lista de deseos","Products you loved are saved here":"Aquí se guardan tus productos favoritos","Review your items and proceed to checkout":"Revisa tus artículos y continúa al pago","Checkout":"Finalizar compra","Complete your order":"Completa tu pedido","My Orders":"Mis pedidos","Track your orders":"Sigue tus pedidos","My Account":"Mi cuenta","Manage your profile and preferences":"Gestiona tu perfil y tus preferencias","Quick Links":"Enlaces rápidos","Shop":"Tienda","Guide":"Guía","Compare":"Comparar","Customer Service":"Atención al cliente","Return Policy":"Política de devoluciones","Shipping Policy":"Política de envíos","FAQ":"Preguntas frecuentes","Contact Us":"Contáctanos","Newsletter":"Boletín","Subscribe for latest offers":"Suscríbete para recibir las últimas ofertas","Subscribe":"Suscribirse","All rights reserved.":"Todos los derechos reservados.","Your cart is empty":"Tu carrito está vacío","Start shopping to add products":"Empieza a comprar para añadir productos","Continue Shopping":"Continuar comprando","Shop Now":"Comprar ahora","Subtotal":"Subtotal","Discount":"Descuento","Shipping":"Envío","Total":"Total","No orders yet":"Aún no hay pedidos","You haven't placed any orders":"Aún no has realizado ningún pedido","Payment":"Pago","Status":"Estado","Product":"Producto","Customer":"Cliente","Actions":"Acciones","Add to Cart":"Añadir al carrito","Buy Now":"Comprar ahora","View Details":"Ver detalles","Back":"Atrás","Continue":"Continuar","Cancel":"Cancelar","Save":"Guardar","Delete":"Eliminar","Confirm":"Confirmar","Close":"Cerrar","Apply":"Aplicar","Remove":"Eliminar","Clear":"Borrar","No results":"Sin resultados","Try different keywords":"Prueba otras palabras","First Order Gift!":"¡Regalo por tu primer pedido!","20% off with code":"20 % de descuento con el código","Copy Code":"Copiar código","Flash Sale":"Oferta flash","Limited-Time Offers":"Ofertas por tiempo limitado","on selected products":"en productos seleccionados","Login":"Iniciar sesión","Register":"Registrarse","No consent → contextual mode":"Sin consentimiento → modo contextual","Required":"Requerido","Restricted":"Restringido","Enforced":"Aplicado","Tracked":"Registrado","Ready.":"Listo.","MULTI-SELLER MARKETPLACE":"MARKETPLACE MULTIVENDEDOR","MARKETPLACE CATEGORIES":"CATEGORÍAS DEL MARKETPLACE","EXPLORE VELORA":"EXPLORA VELORA","FEATURED PRODUCTS":"PRODUCTOS DESTACADOS","TRENDING NOW":"TENDENCIAS","SELL ON VELORA":"VENDE EN VELORA","LIMITED-TIME OFFERS":"OFERTAS POR TIEMPO LIMITADO","DISCOVER STORES":"DESCUBRE TIENDAS","LEARN":"APRENDE","ARTICLES":"ARTÍCULOS","COMPARE SMARTLY":"COMPARA DE FORMA INTELIGENTE","REAL EXPERIENCES":"EXPERIENCIAS REALES","Recommended for you":"Recomendado para ti","Quality-first discovery using Velora catalog signals. Personalized recommendations are only used when the relevant consent allows them.":"Descubrimiento centrado en la calidad mediante señales del catálogo de Velora. Las recomendaciones personalizadas solo se usan cuando existe el consentimiento correspondiente.","Continue exploring":"Continúa explorando","Pick up where you left off with products you viewed recently.":"Continúa desde donde lo dejaste con los productos que viste recientemente.","Explore all →":"Explorar todo →","VELORA DISCOVERY":"DESCUBRIMIENTO VELORA","Protected checkout":"Pago seguro","Payment attempts and order creation use governed backend flows.":"Los intentos de pago y la creación de pedidos utilizan flujos backend gobernados.","Multi-seller":"Multi-vendedor","Shop multiple stores from one marketplace experience.":"Compra en varias tiendas desde una sola experiencia de marketplace.","Track your order":"Sigue tu pedido","Shipping status and delivery evidence can follow the order lifecycle.":"El estado del envío y las pruebas de entrega siguen el ciclo de vida del pedido.","Trust & Safety":"Confianza y seguridad","Returns, disputes, fraud controls, and account enforcement are governed.":"Las devoluciones, disputas, controles contra el fraude y medidas sobre cuentas están regulados.","Email":"Correo electrónico","Password":"Contraseña","Create Account":"Crear cuenta","Don't have an account? Create one":"¿No tienes una cuenta? Crea una"},"ar":{"Home":"الرئيسية","Categories":"الفئات","Shops":"المتاجر","Deals":"العروض","Sell on Velora":"البيع على Velora","Wishlist":"المفضلة","Orders":"الطلبات","Cart":"السلة","Account":"الحساب","Theme":"المظهر","Language":"اللغة","Search":"بحث","Shopping Cart":"سلة التسوق","Discover More.":"اكتشف المزيد.","Shop Better.":"تسوق بشكل أفضل.","Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.":"كل ما تحتاجه من متاجر يمكنك الوثوق بها. استكشف المنتجات واكتشف البائعين الجدد وتسوق بذكاء — كل ذلك في سوق واحد.","Start Shopping":"ابدأ التسوق","Become a Seller":"كن بائعًا","Products":"المنتجات","Seller":"البائع","Powered":"مدعوم","Marketplace Categories":"فئات السوق","Explore Velora":"استكشف Velora","Shop What You Love":"تسوق ما تحب","Velora is built for every kind of store — not just one category.":"تم تصميم Velora لكل أنواع المتاجر، وليس لفئة واحدة فقط.","All Products":"كل المنتجات","Explore everything":"استكشف كل شيء","Electronics":"الإلكترونيات","Phones & tech":"الهواتف والتقنية","Fashion":"الأزياء","Style & accessories":"الأناقة والإكسسوارات","Beauty":"الجمال","Skincare & more":"العناية بالبشرة والمزيد","Home & Living":"المنزل والمعيشة","For your space":"للمساحة الخاصة بك","Sports":"الرياضة","Move & play":"تحرك والعب","Featured Products":"منتجات مميزة","Trending Now":"الرائج الآن","Popular on Velora":"الأكثر شعبية على Velora","View All Products":"عرض كل المنتجات","Build your store. Reach more customers.":"ابنِ متجرك ووصل إلى المزيد من العملاء.","Velora brings products, sellers, discovery and shopping together in one growing marketplace.":"تجمع Velora المنتجات والبائعين والاكتشاف والتسوق في سوق واحد متنامٍ.","Open Your Store":"افتح متجرك","Explore products across multiple categories and growing stores.":"استكشف المنتجات عبر فئات متعددة ومتاجر متنامية.","Filters":"الفلاتر","Featured":"مميزة","Price: Low to High":"السعر: من الأقل إلى الأعلى","Price: High to Low":"السعر: من الأعلى إلى الأقل","Top Rated":"الأعلى تقييمًا","Name (A-Z)":"الاسم (أ-ي)","products":"منتجات","Discover independent sellers and growing brands in one marketplace.":"اكتشف البائعين المستقلين والعلامات التجارية المتنامية في سوق واحد.","Shops on Velora":"المتاجر على Velora","Velora Deals":"عروض Velora","Explore popular products and marketplace offers from stores you can trust.":"استكشف المنتجات الشائعة وعروض السوق من متاجر يمكنك الوثوق بها.","Complete Guide":"الدليل الكامل","How to shop, sell, manage orders, and get the most from Velora.":"تعرف على كيفية التسوق والبيع وإدارة الطلبات والاستفادة القصوى من Velora.","Blog":"المدونة","Marketplace stories, shopping tips, and seller insights.":"قصص السوق ونصائح التسوق ورؤى البائعين.","Smart Comparison":"مقارنة ذكية","Choose any number of products and compare them in all details":"اختر أي عدد من المنتجات وقارن بينها في جميع التفاصيل","Start Comparison":"ابدأ المقارنة","Search for a product above and add it":"ابحث عن منتج أعلاه وأضفه","Real Reviews":"تقييمات حقيقية","Read real experiences and share yours":"اقرأ تجارب حقيقية وشارك تجربتك","My Wishlist":"قائمتي المفضلة","Products you loved are saved here":"يتم حفظ المنتجات التي أعجبتك هنا","Review your items and proceed to checkout":"راجع منتجاتك وانتقل إلى الدفع","Checkout":"إتمام الطلب","Complete your order":"أكمل طلبك","My Orders":"طلباتي","Track your orders":"تتبع طلباتك","My Account":"حسابي","Manage your profile and preferences":"أدر ملفك الشخصي وتفضيلاتك","Quick Links":"روابط سريعة","Shop":"المتجر","Guide":"الدليل","Compare":"مقارنة","Customer Service":"خدمة العملاء","Return Policy":"سياسة الإرجاع","Shipping Policy":"سياسة الشحن","FAQ":"الأسئلة الشائعة","Contact Us":"اتصل بنا","Newsletter":"النشرة البريدية","Subscribe for latest offers":"اشترك للحصول على أحدث العروض","Subscribe":"اشتراك","All rights reserved.":"جميع الحقوق محفوظة.","Your cart is empty":"سلة التسوق فارغة","Start shopping to add products":"ابدأ التسوق لإضافة المنتجات","Continue Shopping":"متابعة التسوق","Shop Now":"تسوق الآن","Subtotal":"المجموع الفرعي","Discount":"الخصم","Shipping":"الشحن","Total":"الإجمالي","No orders yet":"لا توجد طلبات بعد","You haven't placed any orders":"لم تقم بإنشاء أي طلبات بعد","Payment":"الدفع","Status":"الحالة","Product":"المنتج","Customer":"العميل","Actions":"الإجراءات","Add to Cart":"أضف إلى السلة","Buy Now":"اشترِ الآن","View Details":"عرض التفاصيل","Back":"رجوع","Continue":"متابعة","Cancel":"إلغاء","Save":"حفظ","Delete":"حذف","Confirm":"تأكيد","Close":"إغلاق","Apply":"تطبيق","Remove":"إزالة","Clear":"مسح","No results":"لا توجد نتائج","Try different keywords":"جرّب كلمات مختلفة","First Order Gift!":"هدية الطلب الأول!","20% off with code":"خصم 20% باستخدام الكود","Copy Code":"نسخ الكود","Flash Sale":"عرض سريع","Limited-Time Offers":"عروض لفترة محدودة","on selected products":"على منتجات مختارة","Login":"تسجيل الدخول","Register":"إنشاء حساب","No consent → contextual mode":"بدون موافقة ← وضع سياقي","Required":"مطلوب","Restricted":"مقيّد","Enforced":"مُطبّق","Tracked":"متتبع","Ready.":"جاهز.","MULTI-SELLER MARKETPLACE":"سوق متعدد البائعين","MARKETPLACE CATEGORIES":"فئات السوق","EXPLORE VELORA":"استكشف Velora","FEATURED PRODUCTS":"منتجات مميزة","TRENDING NOW":"الرائج الآن","SELL ON VELORA":"البيع على Velora","LIMITED-TIME OFFERS":"عروض لفترة محدودة","DISCOVER STORES":"اكتشف المتاجر","LEARN":"تعلّم","ARTICLES":"مقالات","COMPARE SMARTLY":"قارن بذكاء","REAL EXPERIENCES":"تجارب حقيقية","Recommended for you":"موصى به لك","Quality-first discovery using Velora catalog signals. Personalized recommendations are only used when the relevant consent allows them.":"اكتشاف يركز على الجودة باستخدام إشارات كتالوج Velora. لا تُستخدم التوصيات المخصصة إلا عند توفر الموافقة المناسبة.","Continue exploring":"تابع الاستكشاف","Pick up where you left off with products you viewed recently.":"تابع من حيث توقفت مع المنتجات التي شاهدتها مؤخرًا.","Explore all →":"استكشف الكل →","VELORA DISCOVERY":"اكتشاف فيلورا","Protected checkout":"دفع آمن","Payment attempts and order creation use governed backend flows.":"تتم محاولات الدفع وإنشاء الطلبات عبر تدفقات خلفية محكومة.","Multi-seller":"متعدد البائعين","Shop multiple stores from one marketplace experience.":"تسوّق من عدة متاجر ضمن تجربة سوق واحدة.","Track your order":"تتبّع طلبك","Shipping status and delivery evidence can follow the order lifecycle.":"يمكن متابعة حالة الشحن وإثباتات التسليم ضمن دورة حياة الطلب.","Trust & Safety":"الثقة والأمان","Returns, disputes, fraud controls, and account enforcement are governed.":"تخضع عمليات الإرجاع والنزاعات وضوابط الاحتيال وإجراءات الحساب للحوكمة.","A global multi-vendor marketplace connecting customers with independent stores and brands.":"سوق عالمي متعدد البائعين يربط العملاء بالمتاجر والعلامات التجارية المستقلة.","Your email":"بريدك الإلكتروني","Email":"البريد الإلكتروني","Password":"كلمة المرور","Create Account":"إنشاء حساب","Don't have an account? Create one":"ليس لديك حساب؟ أنشئ حسابًا"},"fr":{"Home":"Accueil","Categories":"Catégories","Shops":"Boutiques","Deals":"Offres","Sell on Velora":"Vendre sur Velora","Wishlist":"Favoris","Orders":"Commandes","Cart":"Panier","Account":"Compte","Theme":"Thème","Language":"Langue","Search":"Rechercher","Shopping Cart":"Panier","Discover More.":"Découvrez plus.","Shop Better.":"Achetez mieux.","Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.":"Tout ce dont vous avez besoin, auprès de boutiques de confiance. Explorez les produits, découvrez de nouveaux vendeurs et achetez plus intelligemment, le tout sur une seule marketplace.","Start Shopping":"Commencer les achats","Become a Seller":"Devenir vendeur","Products":"Produits","Seller":"Vendeur","Powered":"Propulsé","Marketplace Categories":"Catégories du marketplace","Explore Velora":"Découvrez Velora","Shop What You Love":"Achetez ce que vous aimez","Velora is built for every kind of store — not just one category.":"Velora est conçue pour tous les types de boutiques — pas seulement une catégorie.","All Products":"Tous les produits","Explore everything":"Tout explorer","Electronics":"Électronique","Phones & tech":"Téléphones et technologie","Fashion":"Mode","Style & accessories":"Style et accessoires","Beauty":"Beauté","Skincare & more":"Soins de la peau et plus","Home & Living":"Maison et quotidien","For your space":"Pour votre intérieur","Sports":"Sports","Move & play":"Bougez et jouez","Featured Products":"Produits en vedette","Trending Now":"Tendances","Popular on Velora":"Populaire sur Velora","View All Products":"Voir tous les produits","Build your store. Reach more customers.":"Développez votre boutique. Touchez plus de clients.","Velora brings products, sellers, discovery and shopping together in one growing marketplace.":"Velora réunit produits, vendeurs, découverte et achats dans une marketplace en pleine croissance.","Open Your Store":"Ouvrez votre boutique","Explore products across multiple categories and growing stores.":"Explorez des produits dans plusieurs catégories et des boutiques en croissance.","Filters":"Filtres","Featured":"En vedette","Price: Low to High":"Prix : croissant","Price: High to Low":"Prix : décroissant","Top Rated":"Mieux notés","Name (A-Z)":"Nom (A-Z)","products":"produits","Discover independent sellers and growing brands in one marketplace.":"Découvrez des vendeurs indépendants et des marques en croissance sur une seule marketplace.","Shops on Velora":"Boutiques sur Velora","Velora Deals":"Offres Velora","Explore popular products and marketplace offers from stores you can trust.":"Explorez les produits populaires et les offres de la marketplace auprès de boutiques de confiance.","Complete Guide":"Guide complet","How to shop, sell, manage orders, and get the most from Velora.":"Comment acheter, vendre, gérer vos commandes et profiter pleinement de Velora.","Blog":"Blog","Marketplace stories, shopping tips, and seller insights.":"Actualités de la marketplace, conseils d'achat et informations pour les vendeurs.","Smart Comparison":"Comparaison intelligente","Choose any number of products and compare them in all details":"Choisissez autant de produits que vous le souhaitez et comparez-les dans tous leurs détails","Start Comparison":"Commencer la comparaison","Search for a product above and add it":"Recherchez un produit ci-dessus et ajoutez-le","Real Reviews":"Avis réels","Read real experiences and share yours":"Lisez de vraies expériences et partagez la vôtre","My Wishlist":"Ma liste de souhaits","Products you loved are saved here":"Vos produits préférés sont enregistrés ici","Review your items and proceed to checkout":"Vérifiez vos articles et passez au paiement","Checkout":"Passer la commande","Complete your order":"Finalisez votre commande","My Orders":"Mes commandes","Track your orders":"Suivez vos commandes","My Account":"Mon compte","Manage your profile and preferences":"Gérez votre profil et vos préférences","Quick Links":"Liens rapides","Shop":"Boutique","Guide":"Guide","Compare":"Comparer","Customer Service":"Service client","Return Policy":"Politique de retour","Shipping Policy":"Politique d’expédition","FAQ":"FAQ","Contact Us":"Nous contacter","Newsletter":"Newsletter","Subscribe for latest offers":"Abonnez-vous pour recevoir les dernières offres","Subscribe":"S’abonner","All rights reserved.":"Tous droits réservés.","Your cart is empty":"Votre panier est vide","Start shopping to add products":"Commencez vos achats pour ajouter des produits","Continue Shopping":"Continuer les achats","Shop Now":"Acheter maintenant","Subtotal":"Sous-total","Discount":"Réduction","Shipping":"Livraison","Total":"Total","No orders yet":"Aucune commande","You haven't placed any orders":"Vous n'avez passé aucune commande","Payment":"Paiement","Status":"Statut","Product":"Produit","Customer":"Client","Actions":"Actions","Add to Cart":"Ajouter au panier","Buy Now":"Acheter maintenant","View Details":"Voir les détails","Back":"Retour","Continue":"Continuer","Cancel":"Annuler","Save":"Enregistrer","Delete":"Supprimer","Confirm":"Confirmer","Close":"Fermer","Apply":"Appliquer","Remove":"Supprimer","Clear":"Effacer","No results":"Aucun résultat","Try different keywords":"Essayez d’autres mots-clés","First Order Gift!":"Cadeau pour votre première commande !","20% off with code":"20 % de réduction avec le code","Copy Code":"Copier le code","Flash Sale":"Vente flash","Limited-Time Offers":"Offres à durée limitée","on selected products":"sur une sélection de produits","Login":"Connexion","Register":"Inscription","No consent → contextual mode":"Sans consentement → mode contextuel","Required":"Requis","Restricted":"Restreint","Enforced":"Appliqué","Tracked":"Suivi","Ready.":"Prêt.","MULTI-SELLER MARKETPLACE":"MARKETPLACE MULTI-VENDEURS","MARKETPLACE CATEGORIES":"CATÉGORIES DU MARKETPLACE","EXPLORE VELORA":"EXPLORER VELORA","FEATURED PRODUCTS":"PRODUITS EN VEDETTE","TRENDING NOW":"TENDANCES","SELL ON VELORA":"VENDRE SUR VELORA","LIMITED-TIME OFFERS":"OFFRES À DURÉE LIMITÉE","DISCOVER STORES":"DÉCOUVRIR LES BOUTIQUES","LEARN":"APPRENDRE","ARTICLES":"ARTICLES","COMPARE SMARTLY":"COMPARER INTELLIGEMMENT","REAL EXPERIENCES":"EXPÉRIENCES RÉELLES","Recommended for you":"Recommandé pour vous","Quality-first discovery using Velora catalog signals. Personalized recommendations are only used when the relevant consent allows them.":"Découverte axée sur la qualité grâce aux signaux du catalogue Velora. Les recommandations personnalisées ne sont utilisées qu'avec le consentement approprié.","Continue exploring":"Continuez votre exploration","Pick up where you left off with products you viewed recently.":"Reprenez là où vous vous êtes arrêté avec les produits que vous avez consultés récemment.","Explore all →":"Tout explorer →","VELORA DISCOVERY":"DÉCOUVERTE VELORA","Protected checkout":"Paiement sécurisé","Payment attempts and order creation use governed backend flows.":"Les tentatives de paiement et la création de commandes utilisent des flux backend gouvernés.","Multi-seller":"Multi-vendeurs","Shop multiple stores from one marketplace experience.":"Achetez auprès de plusieurs boutiques dans une seule expérience marketplace.","Track your order":"Suivez votre commande","Shipping status and delivery evidence can follow the order lifecycle.":"Le statut d'expédition et les preuves de livraison suivent le cycle de vie de la commande.","Trust & Safety":"Confiance et sécurité","Returns, disputes, fraud controls, and account enforcement are governed.":"Les retours, litiges, contrôles anti-fraude et mesures d'application des règles sont encadrés.","Velora Marketplace Protection":"Protection de la marketplace Velora","Secure checkout":"Paiement sécurisé","Order tracking":"Suivi de commande","Delivery proof":"Preuve de livraison","Returns & disputes":"Retours et litiges","Seller and order data remain governed by Velora access controls. Delivery proof and dispute workflows are available where enabled for the order.":"Les données des vendeurs et des commandes restent soumises aux contrôles d'accès de Velora. Les preuves de livraison et les workflows de litige sont disponibles lorsqu'ils sont activés pour la commande.","Search results are ranked with catalog quality, relevance, stock, rating and marketplace fairness signals.":"Les résultats de recherche sont classés selon la qualité du catalogue, la pertinence, le stock, les évaluations et des signaux d'équité de la marketplace.","Seller Operations":"Opérations vendeur","Orders unavailable":"Commandes indisponibles","AUTH REQUIRED":"AUTHENTIFICATION REQUISE","A global multi-vendor marketplace connecting customers with independent stores and brands.":"Une marketplace mondiale multi-vendeurs qui met en relation les clients avec des boutiques et des marques indépendantes.","Your email":"Votre e-mail","Email":"E-mail","Password":"Mot de passe","Create Account":"Créer un compte","Don't have an account? Create one":"Vous n'avez pas de compte ? Créez-en un"},"de":{"Home":"Startseite","Categories":"Kategorien","Shops":"Shops","Deals":"Angebote","Sell on Velora":"Auf Velora verkaufen","Wishlist":"Wunschliste","Orders":"Bestellungen","Cart":"Warenkorb","Account":"Konto","Theme":"Design","Language":"Sprache","Search":"Suchen","Start Shopping":"Jetzt einkaufen","Become a Seller":"Verkäufer werden","Products":"Produkte","Seller":"Verkäufer","All Products":"Alle Produkte","Electronics":"Elektronik","Beauty":"Beauty","Home & Living":"Wohnen & Leben","Sports":"Sport","Featured Products":"Empfohlene Produkte","Trending Now":"Jetzt im Trend","Popular on Velora":"Beliebt auf Velora","View All Products":"Alle Produkte ansehen","Filters":"Filter","Featured":"Empfohlen","Price: Low to High":"Preis: aufsteigend","Price: High to Low":"Preis: absteigend","Top Rated":"Bestbewertet","Name (A-Z)":"Name (A-Z)","products":"Produkte","Shops on Velora":"Shops auf Velora","Complete Guide":"Kompletter Leitfaden","Smart Comparison":"Intelligenter Vergleich","Start Comparison":"Vergleich starten","Real Reviews":"Echte Bewertungen","My Wishlist":"Meine Wunschliste","Checkout":"Kasse","My Orders":"Meine Bestellungen","My Account":"Mein Konto","Quick Links":"Schnelllinks","Shop":"Shop","Compare":"Vergleichen","Customer Service":"Kundenservice","Return Policy":"Rückgaberichtlinie","Shipping Policy":"Versandrichtlinie","Contact Us":"Kontakt","Subscribe":"Abonnieren","All rights reserved.":"Alle Rechte vorbehalten.","Your cart is empty":"Ihr Warenkorb ist leer","Continue Shopping":"Weiter einkaufen","Shop Now":"Jetzt einkaufen","Subtotal":"Zwischensumme","Discount":"Rabatt","Shipping":"Versand","Total":"Gesamt","No orders yet":"Noch keine Bestellungen","Payment":"Zahlung","Status":"Status","Product":"Produkt","Customer":"Kunde","Actions":"Aktionen","Add to Cart":"In den Warenkorb","Buy Now":"Jetzt kaufen","View Details":"Details ansehen","Back":"Zurück","Continue":"Weiter","Cancel":"Abbrechen","Save":"Speichern","Delete":"Löschen","Confirm":"Bestätigen","Close":"Schließen","Apply":"Anwenden","Remove":"Entfernen","Clear":"Löschen","No results":"Keine Ergebnisse","Try different keywords":"Probieren Sie andere Suchbegriffe","Login":"Anmelden","Register":"Registrieren","Required":"Erforderlich","Restricted":"Eingeschränkt","Enforced":"Erzwungen","Tracked":"Erfasst","Ready.":"Bereit.","MULTI-SELLER MARKETPLACE":"MARKTPLATZ MIT MEHREREN VERKÄUFERN","MARKETPLACE CATEGORIES":"MARKTPLATZ-KATEGORIEN","EXPLORE VELORA":"VELORA ENTDECKEN","FEATURED PRODUCTS":"EMPFOHLENE PRODUKTE","TRENDING NOW":"JETZT IM TREND","SELL ON VELORA":"AUF VELORA VERKAUFEN","LIMITED-TIME OFFERS":"ANGEBOTE FÜR KURZE ZEIT","DISCOVER STORES":"SHOPS ENTDECKEN","LEARN":"LERNEN","ARTICLES":"ARTIKEL","COMPARE SMARTLY":"INTELLIGENT VERGLEICHEN","REAL EXPERIENCES":"ECHTE ERFAHRUNGEN"},"it":{"Home":"Home","Categories":"Categorie","Shops":"Negozi","Deals":"Offerte","Sell on Velora":"Vendi su Velora","Wishlist":"Preferiti","Orders":"Ordini","Cart":"Carrello","Account":"Account","Theme":"Tema","Language":"Lingua","Search":"Cerca","Start Shopping":"Inizia a fare acquisti","Become a Seller":"Diventa venditore","Products":"Prodotti","Seller":"Venditore","All Products":"Tutti i prodotti","Electronics":"Elettronica","Fashion":"Moda","Beauty":"Bellezza","Home & Living":"Casa e vita","Featured Products":"Prodotti in evidenza","Trending Now":"Di tendenza","Popular on Velora":"Popolare su Velora","View All Products":"Vedi tutti i prodotti","Filters":"Filtri","Featured":"In evidenza","Price: Low to High":"Prezzo: dal più basso","Price: High to Low":"Prezzo: dal più alto","Top Rated":"Più votati","Name (A-Z)":"Nome (A-Z)","products":"prodotti","Shops on Velora":"Negozi su Velora","Complete Guide":"Guida completa","Smart Comparison":"Confronto intelligente","Start Comparison":"Inizia confronto","Real Reviews":"Recensioni reali","My Wishlist":"La mia lista dei desideri","Checkout":"Checkout","My Orders":"I miei ordini","My Account":"Il mio account","Quick Links":"Link rapidi","Customer Service":"Servizio clienti","Return Policy":"Politica di reso","Shipping Policy":"Politica di spedizione","Contact Us":"Contattaci","Subscribe":"Iscriviti","All rights reserved.":"Tutti i diritti riservati.","Your cart is empty":"Il carrello è vuoto","Continue Shopping":"Continua gli acquisti","Shop Now":"Acquista ora","Subtotal":"Subtotale","Discount":"Sconto","Shipping":"Spedizione","Total":"Totale","No orders yet":"Nessun ordine","Payment":"Pagamento","Status":"Stato","Product":"Prodotto","Customer":"Cliente","Actions":"Azioni","Add to Cart":"Aggiungi al carrello","Buy Now":"Acquista ora","View Details":"Vedi dettagli","Back":"Indietro","Continue":"Continua","Cancel":"Annulla","Save":"Salva","Delete":"Elimina","Confirm":"Conferma","Close":"Chiudi","Apply":"Applica","Remove":"Rimuovi","Clear":"Cancella","No results":"Nessun risultato","Try different keywords":"Prova altre parole chiave","Login":"Accedi","Register":"Registrati","Required":"Richiesto","Restricted":"Limitato","Enforced":"Applicato","Tracked":"Tracciato","Ready.":"Pronto.","MULTI-SELLER MARKETPLACE":"MARKETPLACE MULTIVENDITORE","MARKETPLACE CATEGORIES":"CATEGORIE DEL MARKETPLACE","EXPLORE VELORA":"ESPLORA VELORA","FEATURED PRODUCTS":"PRODOTTI IN EVIDENZA","TRENDING NOW":"DI TENDENZA","SELL ON VELORA":"VENDI SU VELORA","LIMITED-TIME OFFERS":"OFFERTE A TEMPO LIMITATO","DISCOVER STORES":"SCOPRI I NEGOZI","LEARN":"IMPARA","ARTICLES":"ARTICOLI","COMPARE SMARTLY":"CONFRONTA IN MODO INTELLIGENTE","REAL EXPERIENCES":"ESPERIENZE REALI"},"pt":{"Home":"Início","Categories":"Categorias","Shops":"Lojas","Deals":"Ofertas","Sell on Velora":"Vender na Velora","Wishlist":"Favoritos","Orders":"Pedidos","Cart":"Carrinho","Account":"Conta","Language":"Idioma","Search":"Pesquisar","Start Shopping":"Começar a comprar","Become a Seller":"Tornar-se vendedor","Products":"Produtos","Seller":"Vendedor","All Products":"Todos os produtos","Electronics":"Eletrónica","Beauty":"Beleza","Home & Living":"Casa e vida","Sports":"Desporto","Featured Products":"Produtos em destaque","Trending Now":"Tendências","Popular on Velora":"Popular na Velora","View All Products":"Ver todos os produtos","Filters":"Filtros","Featured":"Em destaque","Price: Low to High":"Preço: menor para maior","Price: High to Low":"Preço: maior para menor","Top Rated":"Mais bem avaliados","products":"produtos","Shops on Velora":"Lojas na Velora","Complete Guide":"Guia completo","Smart Comparison":"Comparação inteligente","Start Comparison":"Iniciar comparação","Real Reviews":"Avaliações reais","My Wishlist":"A minha lista de desejos","Checkout":"Finalizar compra","My Orders":"Os meus pedidos","My Account":"A minha conta","Quick Links":"Links rápidos","Customer Service":"Serviço ao cliente","Return Policy":"Política de devoluções","Shipping Policy":"Política de envio","Contact Us":"Contacte-nos","Subscribe":"Subscrever","All rights reserved.":"Todos os direitos reservados.","Your cart is empty":"O seu carrinho está vazio","Continue Shopping":"Continuar a comprar","Shop Now":"Comprar agora","Subtotal":"Subtotal","Discount":"Desconto","Shipping":"Envio","Total":"Total","No orders yet":"Ainda não há pedidos","Status":"Estado","Product":"Produto","Actions":"Ações","Add to Cart":"Adicionar ao carrinho","Buy Now":"Comprar agora","View Details":"Ver detalhes","Back":"Voltar","Continue":"Continuar","Cancel":"Cancelar","Save":"Guardar","Delete":"Eliminar","Confirm":"Confirmar","Close":"Fechar","Apply":"Aplicar","Remove":"Remover","Clear":"Limpar","No results":"Sem resultados","Try different keywords":"Tente outras palavras-chave","Login":"Iniciar sessão","Register":"Registar","Required":"Obrigatório","Restricted":"Restrito","Enforced":"Aplicado","Tracked":"Registado","MULTI-SELLER MARKETPLACE":"MARKETPLACE MULTIVENDEDOR","MARKETPLACE CATEGORIES":"CATEGORIAS DO MARKETPLACE","EXPLORE VELORA":"EXPLORAR A VELORA","FEATURED PRODUCTS":"PRODUTOS EM DESTAQUE","TRENDING NOW":"TENDÊNCIAS","SELL ON VELORA":"VENDER NA VELORA","LIMITED-TIME OFFERS":"OFERTAS POR TEMPO LIMITADO","DISCOVER STORES":"DESCOBRIR LOJAS","LEARN":"APRENDER","ARTICLES":"ARTIGOS","COMPARE SMARTLY":"COMPARAR COM INTELIGÊNCIA","REAL EXPERIENCES":"EXPERIÊNCIAS REAIS"},"tr":{"Home":"Ana Sayfa","Categories":"Kategoriler","Shops":"Mağazalar","Deals":"Fırsatlar","Sell on Velora":"Velora’da Sat","Wishlist":"Favoriler","Orders":"Siparişler","Cart":"Sepet","Account":"Hesap","Language":"Dil","Search":"Ara","Start Shopping":"Alışverişe Başla","Become a Seller":"Satıcı Ol","Products":"Ürünler","Seller":"Satıcı","All Products":"Tüm Ürünler","Electronics":"Elektronik","Beauty":"Güzellik","Home & Living":"Ev ve Yaşam","Sports":"Spor","Featured Products":"Öne Çıkan Ürünler","Trending Now":"Şimdi Trend","Popular on Velora":"Velora’da Popüler","View All Products":"Tüm Ürünleri Gör","Filters":"Filtreler","Featured":"Öne Çıkan","Price: Low to High":"Fiyat: Düşükten Yükseğe","Price: High to Low":"Fiyat: Yüksekten Düşüğe","Top Rated":"En Çok Puan Alan","products":"ürün","Shops on Velora":"Velora Mağazaları","Complete Guide":"Tam Rehber","Smart Comparison":"Akıllı Karşılaştırma","Start Comparison":"Karşılaştırmayı Başlat","Real Reviews":"Gerçek Yorumlar","My Wishlist":"Favorilerim","Checkout":"Ödeme","My Orders":"Siparişlerim","My Account":"Hesabım","Quick Links":"Hızlı Bağlantılar","Customer Service":"Müşteri Hizmetleri","Return Policy":"İade Politikası","Shipping Policy":"Kargo Politikası","Contact Us":"İletişim","Subscribe":"Abone Ol","All rights reserved.":"Tüm hakları saklıdır.","Your cart is empty":"Sepetiniz boş","Continue Shopping":"Alışverişe devam et","Shop Now":"Şimdi alışveriş yap","Subtotal":"Ara toplam","Discount":"İndirim","Shipping":"Kargo","Total":"Toplam","No orders yet":"Henüz sipariş yok","Payment":"Ödeme","Status":"Durum","Product":"Ürün","Customer":"Müşteri","Actions":"İşlemler","Add to Cart":"Sepete ekle","Buy Now":"Hemen al","View Details":"Detayları görüntüle","Back":"Geri","Continue":"Devam et","Cancel":"İptal","Save":"Kaydet","Delete":"Sil","Confirm":"Onayla","Close":"Kapat","Apply":"Uygula","Remove":"Kaldır","Clear":"Temizle","No results":"Sonuç yok","Try different keywords":"Farklı anahtar kelimeler deneyin","Login":"Giriş yap","Register":"Kayıt ol","Required":"Gerekli","Restricted":"Kısıtlı","Enforced":"Uygulandı","Tracked":"Takip ediliyor","Ready.":"Hazır.","MULTI-SELLER MARKETPLACE":"ÇOK SATICILI PAZAR YERİ","MARKETPLACE CATEGORIES":"PAZAR YERİ KATEGORİLERİ","EXPLORE VELORA":"VELORA’YI KEŞFET","FEATURED PRODUCTS":"ÖNE ÇIKAN ÜRÜNLER","TRENDING NOW":"ŞİMDİ TREND","SELL ON VELORA":"VELORA’DA SAT","LIMITED-TIME OFFERS":"SINIRLI SÜRELİ TEKLİFLER","DISCOVER STORES":"MAĞAZALARI KEŞFET","LEARN":"ÖĞREN","ARTICLES":"MAKALELER","COMPARE SMARTLY":"AKILLI KARŞILAŞTIR","REAL EXPERIENCES":"GERÇEK DENEYİMLER"},"zh":{"Home":"首页","Categories":"分类","Shops":"商店","Deals":"优惠","Sell on Velora":"在 Velora 上销售","Wishlist":"收藏","Orders":"订单","Cart":"购物车","Account":"账户","Theme":"主题","Language":"语言","Search":"搜索","Start Shopping":"开始购物","Become a Seller":"成为卖家","Products":"商品","Seller":"卖家","All Products":"全部商品","Electronics":"电子产品","Fashion":"时尚","Beauty":"美妆","Home & Living":"家居生活","Sports":"运动","Featured Products":"精选商品","Trending Now":"当前热门","Popular on Velora":"Velora 热门","View All Products":"查看全部商品","Filters":"筛选","Featured":"精选","Price: Low to High":"价格：从低到高","Price: High to Low":"价格：从高到低","Top Rated":"评分最高","Name (A-Z)":"名称 (A-Z)","products":"件商品","Shops on Velora":"Velora 商店","Complete Guide":"完整指南","Smart Comparison":"智能比较","Start Comparison":"开始比较","Real Reviews":"真实评价","My Wishlist":"我的收藏","Checkout":"结账","My Orders":"我的订单","My Account":"我的账户","Quick Links":"快捷链接","Customer Service":"客户服务","Return Policy":"退货政策","Shipping Policy":"配送政策","Contact Us":"联系我们","Subscribe":"订阅","All rights reserved.":"保留所有权利。","Your cart is empty":"购物车为空","Continue Shopping":"继续购物","Shop Now":"立即购买","Subtotal":"小计","Discount":"折扣","Shipping":"运费","Total":"总计","No orders yet":"暂无订单","Payment":"付款","Status":"状态","Product":"商品","Customer":"客户","Actions":"操作","Add to Cart":"加入购物车","Buy Now":"立即购买","View Details":"查看详情","Back":"返回","Continue":"继续","Cancel":"取消","Save":"保存","Delete":"删除","Confirm":"确认","Close":"关闭","Apply":"应用","Remove":"移除","Clear":"清除","No results":"没有结果","Try different keywords":"请尝试其他关键词","Login":"登录","Register":"注册","Required":"必需","Restricted":"受限","Enforced":"已执行","Tracked":"已跟踪","Ready.":"就绪。","MULTI-SELLER MARKETPLACE":"多卖家购物平台","MARKETPLACE CATEGORIES":"平台分类","EXPLORE VELORA":"探索 Velora","FEATURED PRODUCTS":"精选商品","TRENDING NOW":"热门趋势","SELL ON VELORA":"在 Velora 上销售","LIMITED-TIME OFFERS":"限时优惠","DISCOVER STORES":"发现商店","LEARN":"学习","ARTICLES":"文章","COMPARE SMARTLY":"智能比较","REAL EXPERIENCES":"真实体验","Recommended for you":"为你推荐","Quality-first discovery using Velora catalog signals. Personalized recommendations are only used when the relevant consent allows them.":"基于 Velora 目录信号进行高质量发现。仅在获得相应同意时使用个性化推荐。","Continue exploring":"继续探索","Pick up where you left off with products you viewed recently.":"继续浏览你最近查看过的商品。","Explore all →":"查看全部 →","VELORA DISCOVERY":"VELORA 探索","Protected checkout":"安全结账","Payment attempts and order creation use governed backend flows.":"支付尝试和订单创建使用受治理的后端流程。","Multi-seller":"多卖家","Shop multiple stores from one marketplace experience.":"在一个市场体验中购买来自多家商店的商品。","Track your order":"跟踪你的订单","Shipping status and delivery evidence can follow the order lifecycle.":"可根据订单生命周期查看配送状态和送达凭证。","Trust & Safety":"信任与安全","Returns, disputes, fraud controls, and account enforcement are governed.":"退货、争议、欺诈控制和账户处置均受到治理。","Email":"电子邮箱","Password":"密码","Create Account":"创建账户","Don't have an account? Create one":"还没有账户？创建一个","Build your store. Reach more customers.":"建设你的店铺，触达更多客户。","Velora brings products, sellers, discovery and shopping together in one growing marketplace.":"Velora 将商品、卖家、探索和购物汇聚于一个不断发展的市场。","Open Your Store":"开设你的店铺","A global multi-vendor marketplace connecting customers with independent stores and brands.":"连接客户与独立商店和品牌的全球多卖家市场。","Your email":"你的邮箱","Shop":"商店","Guide":"指南","Compare":"比较","Newsletter":"订阅资讯","Subscribe for latest offers":"订阅以获取最新优惠","Shop What You Love":"购买你喜欢的商品","Velora is built for every kind of store — not just one category.":"Velora 为各种类型的商店而打造，而不仅仅是一个品类。","Seller Operations":"卖家运营","Orders unavailable":"订单不可用","AUTH REQUIRED":"需要登录","AUTH_REQUIRED":"需要登录","Transaction loop unavailable":"交易流程不可用","Integration Control":"集成控制","STAGE 57 Operations":"阶段 57 运营","Operations":"运营"},"ja":{"Home":"ホーム","Categories":"カテゴリー","Shops":"ショップ","Deals":"お得情報","Sell on Velora":"Veloraで販売","Wishlist":"お気に入り","Orders":"注文","Cart":"カート","Account":"アカウント","Theme":"テーマ","Language":"言語","Search":"検索","Start Shopping":"ショッピングを始める","Become a Seller":"販売者になる","Seller":"販売者","All Products":"すべての商品","Electronics":"電子機器","Fashion":"ファッション","Beauty":"ビューティー","Home & Living":"ホーム＆ライフ","Sports":"スポーツ","Featured Products":"おすすめ商品","Trending Now":"トレンド","Popular on Velora":"Veloraで人気","View All Products":"すべての商品を見る","Filters":"フィルター","Featured":"おすすめ","Price: Low to High":"価格：安い順","Price: High to Low":"価格：高い順","Top Rated":"高評価","products":"商品","Shops on Velora":"Veloraのショップ","Complete Guide":"完全ガイド","Smart Comparison":"スマート比較","Start Comparison":"比較を開始","Real Reviews":"実際のレビュー","My Wishlist":"お気に入り一覧","Checkout":"チェックアウト","My Orders":"注文履歴","My Account":"マイアカウント","Quick Links":"クイックリンク","Customer Service":"カスタマーサービス","Return Policy":"返品ポリシー","Shipping Policy":"配送ポリシー","Contact Us":"お問い合わせ","Subscribe":"購読する","All rights reserved.":"無断転載を禁じます。","Your cart is empty":"カートは空です","Continue Shopping":"買い物を続ける","Shop Now":"今すぐ購入","Subtotal":"小計","Discount":"割引","Shipping":"送料","Total":"合計","No orders yet":"注文はまだありません","Payment":"支払い","Status":"ステータス","Customer":"顧客","Add to Cart":"カートに追加","Buy Now":"今すぐ購入","View Details":"詳細を見る","Back":"戻る","Continue":"続ける","Cancel":"キャンセル","Delete":"削除","Confirm":"確認","Close":"閉じる","Apply":"適用","Remove":"削除","Clear":"クリア","No results":"結果なし","Try different keywords":"別のキーワードを試してください","Login":"ログイン","Register":"登録","Required":"必須","Restricted":"制限あり","Enforced":"適用済み","Tracked":"追跡済み","Ready.":"準備完了。","MULTI-SELLER MARKETPLACE":"マルチセラーマーケットプレイス","MARKETPLACE CATEGORIES":"マーケットプレイスのカテゴリー","EXPLORE VELORA":"Veloraを探索","FEATURED PRODUCTS":"おすすめ商品","TRENDING NOW":"トレンド","SELL ON VELORA":"Veloraで販売","LIMITED-TIME OFFERS":"期間限定オファー","DISCOVER STORES":"ショップを探す","LEARN":"学ぶ","ARTICLES":"記事","COMPARE SMARTLY":"スマートに比較","REAL EXPERIENCES":"リアルな体験"},"ko":{"Home":"홈","Categories":"카테고리","Shops":"상점","Deals":"특가","Sell on Velora":"Velora에서 판매","Wishlist":"찜","Orders":"주문","Cart":"장바구니","Account":"계정","Theme":"테마","Language":"언어","Search":"검색","Start Shopping":"쇼핑 시작","Become a Seller":"판매자 되기","Products":"상품","Seller":"판매자","All Products":"모든 상품","Electronics":"전자제품","Fashion":"패션","Beauty":"뷰티","Home & Living":"홈 & 리빙","Sports":"스포츠","Featured Products":"추천 상품","Trending Now":"지금 인기","Popular on Velora":"Velora 인기 상품","View All Products":"모든 상품 보기","Filters":"필터","Featured":"추천","Price: Low to High":"가격 낮은순","Price: High to Low":"가격 높은순","Top Rated":"평점순","products":"상품","Shops on Velora":"Velora 상점","Complete Guide":"전체 가이드","Smart Comparison":"스마트 비교","Start Comparison":"비교 시작","Real Reviews":"실제 리뷰","My Wishlist":"내 찜 목록","Checkout":"결제","My Orders":"내 주문","My Account":"내 계정","Quick Links":"빠른 링크","Customer Service":"고객 서비스","Return Policy":"반품 정책","Shipping Policy":"배송 정책","Contact Us":"문의하기","Subscribe":"구독","All rights reserved.":"모든 권리 보유.","Your cart is empty":"장바구니가 비어 있습니다","Continue Shopping":"쇼핑 계속하기","Shop Now":"지금 쇼핑하기","Subtotal":"소계","Discount":"할인","Shipping":"배송","Total":"총액","No orders yet":"아직 주문이 없습니다","Payment":"결제","Status":"상태","Product":"상품","Customer":"고객","Actions":"작업","Add to Cart":"장바구니에 담기","Buy Now":"지금 구매","View Details":"상세 보기","Back":"뒤로","Continue":"계속","Cancel":"취소","Save":"저장","Delete":"삭제","Confirm":"확인","Close":"닫기","Apply":"적용","Remove":"제거","Clear":"지우기","No results":"결과 없음","Try different keywords":"다른 키워드를 입력해 보세요","Login":"로그인","Register":"회원가입","Required":"필수","Restricted":"제한됨","Enforced":"적용됨","Tracked":"추적됨","Ready.":"준비 완료.","MULTI-SELLER MARKETPLACE":"멀티 셀러 마켓플레이스","MARKETPLACE CATEGORIES":"마켓플레이스 카테고리","EXPLORE VELORA":"Velora 둘러보기","FEATURED PRODUCTS":"추천 상품","TRENDING NOW":"지금 인기","SELL ON VELORA":"Velora에서 판매","LIMITED-TIME OFFERS":"기간 한정 혜택","DISCOVER STORES":"상점 둘러보기","LEARN":"배우기","ARTICLES":"기사","COMPARE SMARTLY":"스마트 비교","REAL EXPERIENCES":"실제 경험"},"hi":{"Home":"होम","Categories":"श्रेणियाँ","Shops":"दुकानें","Deals":"ऑफ़र","Sell on Velora":"Velora पर बेचें","Wishlist":"पसंदीदा","Orders":"ऑर्डर","Cart":"कार्ट","Account":"खाता","Theme":"थीम","Language":"भाषा","Search":"खोजें","Start Shopping":"खरीदारी शुरू करें","Become a Seller":"विक्रेता बनें","Products":"उत्पाद","Seller":"विक्रेता","All Products":"सभी उत्पाद","Electronics":"इलेक्ट्रॉनिक्स","Fashion":"फ़ैशन","Beauty":"ब्यूटी","Home & Living":"घर और जीवन","Sports":"खेल","Featured Products":"विशेष उत्पाद","Trending Now":"अभी ट्रेंडिंग","Popular on Velora":"Velora पर लोकप्रिय","View All Products":"सभी उत्पाद देखें","Filters":"फ़िल्टर","Featured":"विशेष","Price: Low to High":"कीमत: कम से अधिक","Price: High to Low":"कीमत: अधिक से कम","Top Rated":"सर्वोच्च रेटेड","products":"उत्पाद","Shops on Velora":"Velora पर दुकानें","Complete Guide":"पूरी गाइड","Smart Comparison":"स्मार्ट तुलना","Start Comparison":"तुलना शुरू करें","Real Reviews":"वास्तविक समीक्षाएँ","My Wishlist":"मेरी पसंदीदा सूची","Checkout":"चेकआउट","My Orders":"मेरे ऑर्डर","My Account":"मेरा खाता","Quick Links":"त्वरित लिंक","Customer Service":"ग्राहक सेवा","Return Policy":"वापसी नीति","Shipping Policy":"शिपिंग नीति","Contact Us":"संपर्क करें","Subscribe":"सदस्यता लें","All rights reserved.":"सर्वाधिकार सुरक्षित।","Your cart is empty":"आपकी कार्ट खाली है","Continue Shopping":"खरीदारी जारी रखें","Shop Now":"अभी खरीदें","Subtotal":"उप-योग","Discount":"छूट","Shipping":"शिपिंग","Total":"कुल","No orders yet":"अभी कोई ऑर्डर नहीं","Payment":"भुगतान","Status":"स्थिति","Product":"उत्पाद","Customer":"ग्राहक","Actions":"क्रियाएँ","Add to Cart":"कार्ट में जोड़ें","Buy Now":"अभी खरीदें","View Details":"विवरण देखें","Back":"वापस","Continue":"जारी रखें","Cancel":"रद्द करें","Save":"सहेजें","Delete":"हटाएँ","Confirm":"पुष्टि करें","Close":"बंद करें","Apply":"लागू करें","Remove":"हटाएँ","Clear":"साफ़ करें","No results":"कोई परिणाम नहीं","Try different keywords":"अन्य कीवर्ड आज़माएँ","Login":"लॉग इन","Register":"पंजीकरण","Required":"आवश्यक","Restricted":"सीमित","Enforced":"लागू","Tracked":"ट्रैक किया गया","Ready.":"तैयार।","MULTI-SELLER MARKETPLACE":"मल्टी-सेलर मार्केटप्लेस","MARKETPLACE CATEGORIES":"मार्केटप्लेस श्रेणियाँ","EXPLORE VELORA":"Velora देखें","FEATURED PRODUCTS":"विशेष उत्पाद","TRENDING NOW":"अभी ट्रेंडिंग","SELL ON VELORA":"Velora पर बेचें","LIMITED-TIME OFFERS":"सीमित समय के ऑफ़र","DISCOVER STORES":"दुकानें खोजें","LEARN":"सीखें","ARTICLES":"लेख","COMPARE SMARTLY":"स्मार्ट तुलना","REAL EXPERIENCES":"वास्तविक अनुभव"}};
window.__VELORA_PACK=PACK;
;
const DIR={en:'ltr',es:'ltr',ar:'rtl',fr:'ltr',de:'ltr',it:'ltr',pt:'ltr',tr:'ltr',zh:'ltr',ja:'ltr',ko:'ltr',hi:'ltr'};
const LANGS=new Set(Object.keys(PACK));
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
const current=()=>{const x=localStorage.getItem('velora_language');return LANGS.has(x)?x:'en';};
const splitPrefix=s=>{const x=String(s);let i=0;while(i<x.length){const c=x.codePointAt(i);const ch=String.fromCodePoint(c);if(/[\p{L}\p{N}]/u.test(ch))break;i+=ch.length;}return [x.slice(0,i),x.slice(i)];};
const keyOf=s=>norm(splitPrefix(norm(s))[1]);
const trSrc=(src,lang)=>{const d=PACK[lang]||PACK.en;const s=norm(src);if(d[s]!==undefined)return d[s];const [prefix,body]=splitPrefix(s);const k=norm(body);if(d[k]!==undefined)return prefix+d[k];const m=k.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);if(m&&d[m[2]]!==undefined)return `${m[1]} ${d[m[2]]}`;return null;};
function render(root=document){const lang=current();document.documentElement.lang=lang;document.documentElement.dir=DIR[lang]||'ltr';const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];let n;while((n=w.nextNode()))nodes.push(n);for(const node of nodes){const p=node.parentElement;if(!p||/^(SCRIPT|STYLE|NOSCRIPT|OPTION|SVG|PATH)$/i.test(p.tagName))continue;const raw=String(node.nodeValue||'');if(!raw.trim())continue;if(node.__veloraI18nSource===undefined)node.__veloraI18nSource=norm(raw);const source=node.__veloraI18nSource;const translated=trSrc(source,lang);const lead=raw.match(/^\s*/)?.[0]||'';const trail=raw.match(/\s*$/)?.[0]||'';if(translated!==null)node.nodeValue=lead+translated+trail;else if(lang==='en')node.nodeValue=lead+source+trail;}const els=(root.querySelectorAll?root:document).querySelectorAll?.('input,textarea,button,[title],[aria-label]')||[];for(const el of els){for(const attr of ['placeholder','title','aria-label']){if(!el.hasAttribute(attr))continue;const slot='data-velora-i18n-'+attr;if(!el.hasAttribute(slot))el.setAttribute(slot,norm(el.getAttribute(attr)||''));const src=el.getAttribute(slot);const translated=trSrc(src,lang);if(translated!==null)el.setAttribute(attr,translated);else if(lang==='en')el.setAttribute(attr,src);}}}
async function client(){return window.mahaSupabase||window.supabaseClient||window.sb||null;}
async function pref(){try{const c=await client();if(!c?.rpc)return null;const r=await c.rpc('velora_get_language_preference');const v=String(r?.data||'');if(LANGS.has(v)){localStorage.setItem('velora_language',v);return v;}}catch(_){ }return null;}
async function overrides(lang){try{const c=await client();if(!c?.from)return {};const r=await c.from('velora_translation_overrides').select('source_text,translated_text').eq('locale',lang).eq('is_active',true);if(r.error||!Array.isArray(r.data))return {};const o={};r.data.forEach(x=>{if(x?.source_text&&x?.translated_text)o[norm(x.source_text)]=x.translated_text;});return o;}catch(_){return {};}}
async function setLang(code){if(!LANGS.has(code))return false;localStorage.setItem('velora_language',code);try{const c=await client();if(c?.rpc)c.rpc('velora_set_language_preference',{p_locale:code});}catch(_){ }const old=PACK[code];const o=await overrides(code);if(Object.keys(o).length)PACK[code]=Object.assign({},old,o);render(document);if(Object.keys(o).length)PACK[code]=old;const s=document.getElementById('languageSelect');if(s)s.value=code;return true;}
function style(){if(document.getElementById('velora-i18n-v4-style'))return;const st=document.createElement('style');st.id='velora-i18n-v4-style';st.textContent='#languageSelect option,#currencySelect option{background:#0f172a!important;color:#fff!important}';document.head.appendChild(st);}
async function boot(){style();const p=await pref();const s=document.getElementById('languageSelect');if(s)s.value=p||current();render(document);const lang=current();const old=PACK[lang];const o=await overrides(lang);if(Object.keys(o).length){PACK[lang]=Object.assign({},old,o);render(document);PACK[lang]=old;}const ob=new MutationObserver(m=>{if(m.some(x=>x.type==='childList'&&x.addedNodes.length))setTimeout(()=>render(document),0);});if(document.body)ob.observe(document.body,{childList:true,subtree:true});}
window.VELORA_I18N_SET_LANGUAGE=setLang;window.VELORA_I18N_RENDER=render;window.VELORA_I18N=PACK;window.VELORA_I18N_VERSION='5.0';window.setVeloraLanguage=setLang;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* ============================================================
   VELORA GLOBAL LANGUAGE BRIDGE — AUTHORITATIVE HANDLER
   The header selector must always call the database-backed I18N
   runtime. This bridge intentionally overrides legacy handlers.
   ============================================================ */
window.setVeloraLanguage = async function(code){
  const lang = String(code || '').toLowerCase();
  try {
    if (typeof window.VELORA_I18N_SET_LANGUAGE === 'function') {
      const ok = await window.VELORA_I18N_SET_LANGUAGE(lang);
      if (ok) return true;
    }
  } catch (_) {}
  const core = window.VELORA_CORE?.languages;
  if (!core?.[lang]) return false;
  try {
    localStorage.setItem('velora_language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = core[lang].dir || 'ltr';
    const el = document.getElementById('languageSelect');
    if (el) el.value = lang;
    if (typeof window.VELORA_I18N_RENDER === 'function') window.VELORA_I18N_RENDER(document);
    return true;
  } catch (_) { return false; }
};


function getVeloraDisplayCurrency(){ return getFromStorage('velora_currency',VELORA_CURRENCY) || 'USD'; }
function getSellerCurrency(seller){ return (seller && VELORA_CURRENCY_META[seller.currency]) ? seller.currency : getVeloraDisplayCurrency(); }
function formatSellerPrice(value,seller){ return formatPrice(value,getSellerCurrency(seller)); }
function saveSeller(seller){
  if(!seller?.id) return null;
  const all=getAllSellers(); const i=all.findIndex(s=>s.id===seller.id);
  if(i>=0) all[i]={...all[i],...seller}; else all.push(seller);
  saveAllSellers(all);
  return seller;
}
function getVeloraSubscription(seller){ const raw=getFromStorage('velora_subscriptions',{}); return seller?.id ? raw[seller.id]||null : null; }
function saveVeloraSubscription(seller,sub){ if(!seller?.id)return null; const raw=getFromStorage('velora_subscriptions',{}); raw[seller.id]=sub; saveToStorage('velora_subscriptions',raw); return sub; }



const SELLER_PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        commission: 20,
        productLimit: 10,
        features: ['10 Products', '20% Commission', 'Basic Analytics', 'Email Support']
    },
    basic: {
        id: 'basic',
        name: 'Basic',
        price: 299,
        commission: 15,
        productLimit: 100,
        features: ['100 Products', '15% Commission', 'Advanced Analytics', 'Live Support', '3 Ad Campaigns']
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 799,
        commission: 12,
        productLimit: 1000,
        features: ['1000 Products', '12% Commission', 'Full Analytics', 'Instant Support', '10 Ad Campaigns', 'Featured Badge']
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 1999,
        commission: 10,
        productLimit: 999999,
        features: ['Unlimited Products', '10% Commission', 'Complete Analytics', 'Account Manager', 'Unlimited Ads', 'Priority Placement']
    }
};

/* ============ USERS MANAGEMENT ============ */
const DEFAULT_OWNER = {
    uid: 'owner_master',
    email: 'owner@maha.com',
    password: hashPassword('Maha@Owner2026'),
    name: 'Platform Owner',
    role: ROLES.OWNER,
    verified: true,
    createdAt: Date.now()
};

const DEFAULT_ADMIN = {
    uid: 'admin_master',
    email: 'admin@maha.com',
    password: hashPassword('Maha@Admin2026'),
    name: 'Platform Admin',
    role: ROLES.ADMIN,
    verified: true,
    createdAt: Date.now()
};

function hashPassword(password) {
    let hash = 0;
    const str = 'maha_' + password + '_2026';
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36);
}

function getAllUsersV2() {
    let users = getFromStorage('maha_users_v2', []);
    
    // Ensure default accounts exist
    if (!users.find(u => u.uid === DEFAULT_OWNER.uid)) {
        users.push(DEFAULT_OWNER);
    }
    if (!users.find(u => u.uid === DEFAULT_ADMIN.uid)) {
        users.push(DEFAULT_ADMIN);
    }
    
    saveToStorage('maha_users_v2', users);
    return users;
}

function saveAllUsersV2(users) {
    saveToStorage('maha_users_v2', users);
}

function findUserByEmailV2(email) {
    return getAllUsersV2().find(u => u.email.toLowerCase() === email.toLowerCase());
}

/* ============ SELLERS MANAGEMENT ============ */
function getAllSellers() {
    return getFromStorage('maha_sellers', []);
}

function saveAllSellers(sellers) {
    saveToStorage('maha_sellers', sellers);
}

function getSellerById(sellerId) {
    return getAllSellers().find(s => s.id === sellerId);
}

function getSellerByUserId(userId) {
    return getAllSellers().find(s => s.userId === userId);
}



/* ============ UPDATE STATE ============ */
// Load user session with role
function loadUserSession() {
    const user = getFromStorage('maha_user', null);
    if (user) {
        STATE.user = user;
    }
    return user;
}

/* ============ SUPABASE PROFILE RECOVERY ============ */
async function ensureSupabaseProfile(authUser, fallbackName = '', fallbackPhone = '') {
    if (!authUser || !window.mahaSupabase) {
        return { profile: null, error: new Error('Authentication service unavailable') };
    }

    const client = window.mahaSupabase;
    const metadata = authUser.user_metadata || {};
    const baseProfile = {
        id: authUser.id,
        name: metadata.name || fallbackName || authUser.email || 'Velora User',
        email: authUser.email || '',
        phone: metadata.phone || fallbackPhone || '',
        role: ROLES.CUSTOMER
    };

    // 1) Existing profile
    let result = await client
        .from('users')
        .select('id, name, email, phone, role')
        .eq('id', authUser.id)
        .maybeSingle();

    if (result.data) return { profile: result.data, error: null };

    // 2) Recover missing profile for an Auth user
    const insertResult = await client
        .from('users')
        .insert(baseProfile)
        .select('id, name, email, phone, role')
        .single();

    if (insertResult.data) return { profile: insertResult.data, error: null };

    // 3) One last read handles race conditions / triggers
    result = await client
        .from('users')
        .select('id, name, email, phone, role')
        .eq('id', authUser.id)
        .maybeSingle();

    if (result.data) return { profile: result.data, error: null };

    return { profile: null, error: insertResult.error || result.error || new Error('Profile could not be created') };
}

/* ============ UPDATE LOGIN TO INCLUDE ROLE ============ */
const originalHandleLogin = handleLogin;
handleLogin = async function(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    // --- Supabase Auth ---
    if (!window.mahaSupabase || !window.mahaSupabase.auth) {
        showToast('❌ Authentication service unavailable', 'error');
        return;
    }

    const { data, error } = await window.mahaSupabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('❌ Login failed:', error);
        const msg = String(error.message || '').toLowerCase();
        if (msg.includes('email not confirmed')) {
            showToast('📧 Please confirm your email before logging in.', 'error');
        } else if (msg.includes('invalid login credentials')) {
            showToast('❌ Incorrect email or password', 'error');
        } else {
            showToast('❌ Login failed. Please try again.', 'error');
        }
        return;
    }

    const authUser = data && data.user;
    if (!authUser) {
        showToast('❌ Incorrect email or password', 'error');
        return;
    }

    // --- Load or recover profile from public.users ---
    const profileResult = await ensureSupabaseProfile(authUser);
    const profile = profileResult.profile;

    if (!profile) {
        console.error('❌ Could not load/recover profile:', profileResult.error);
        const code = profileResult.error && profileResult.error.code;
        if (code === '42501') {
            showToast('❌ Account exists, but profile permissions need to be enabled in Supabase.', 'error');
        } else {
            showToast('❌ Your account exists, but your Velora profile could not be created. Please try again.', 'error');
        }
        return;
    }

    // --- Resolve sellerId (best-effort) ---
    let sellerId = null;
    try {
        const { data: sellerRows, error: sellerLookupError } = await window.mahaSupabase
            .rpc('velora_get_own_seller');
        if (sellerLookupError) throw sellerLookupError;
        const sellerRow = Array.isArray(sellerRows) ? sellerRows[0] : sellerRows;

        if (sellerRow && sellerRow.id) {
            sellerId = sellerRow.id;
        }
    } catch (e) {
        sellerId = null;
    }

    // --- Build STATE.user (Supabase is authoritative) ---
    const hasSellerRole = !!sellerId;
    STATE.user = {
        uid: profile.id,
        name: profile.name || (authUser.user_metadata && authUser.user_metadata.name) || profile.email || authUser.email,
        email: profile.email || authUser.email,
        role: profile.role || ROLES.CUSTOMER,
        roles: hasSellerRole ? [ROLES.CUSTOMER, ROLES.SELLER] : [profile.role || ROLES.CUSTOMER],
        sellerId: sellerId || null,
        isSeller: hasSellerRole
    };

    saveToStorage('maha_user', STATE.user);

    closeModal('authModal');
    showToast('✅ Welcome back, ' + STATE.user.name, 'success');
    updateAccountButton();
    if (typeof updatePlatformSwitcher === 'function') {
        updatePlatformSwitcher();
    }
    setTimeout(() => navigateTo('account'), 500);
};


/* ============ UPDATE REGISTER TO INCLUDE ROLE ============ */
const originalHandleRegister = handleRegister;
handleRegister = async function(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;

    if (password.length < 6) {
        showToast('❌ Password must be at least 6 characters', 'error');
        return;
    }

    if (!window.mahaSupabase || !window.mahaSupabase.auth) {
        showToast('❌ Authentication service unavailable', 'error');
        return;
    }

    // --- Supabase Auth signUp ---
    const { data, error } = await window.mahaSupabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                phone: phone
            }
        }
    });

    if (error) {
        showToast('❌ Could not create your account. Please try again.', 'error');
        return;
    }

    const authUser = data && data.user;
    const session = data && data.session;

    if (!authUser) {
        showToast('❌ Could not create your account. Please try again.', 'error');
        return;
    }

    // --- Case A: no session (email confirmation enabled) ---
    if (!session) {
        closeModal('authModal');
        showToast('📧 Account created. Please check your email to confirm your account.', 'success');
        // Do NOT set STATE.user
        // Do NOT navigate to account
        return;
    }

    // --- Case B: immediate session — create/recover public.users profile ---
    const profileResult = await ensureSupabaseProfile(authUser, name, phone);
    const profile = profileResult.profile;

    if (!profile) {
        console.error('❌ Account created but profile recovery failed:', profileResult.error);
        try { await window.mahaSupabase.auth.signOut(); } catch (e) {}
        STATE.user = null;
        localStorage.removeItem('maha_user');
        updateAccountButton();

        const code = profileResult.error && profileResult.error.code;
        if (code === '42501') {
            showToast('❌ Account was created, but Supabase must allow new users to create their profile.', 'error');
        } else {
            showToast('❌ Account was created, but your Velora profile could not be completed.', 'error');
        }
        return;
    }

    // --- Build STATE.user from authoritative profile ---
    STATE.user = {
        uid: profile.id,
        name: profile.name || name,
        email: profile.email || email,
        role: profile.role || ROLES.CUSTOMER,
        sellerId: null
    };

    saveToStorage('maha_user', STATE.user);

    closeModal('authModal');
    showToast('🎉 Account created! Welcome, ' + STATE.user.name, 'success');
    updateAccountButton();
    if (typeof updatePlatformSwitcher === 'function') {
        updatePlatformSwitcher();
    }
    setTimeout(() => navigateTo('account'), 500);
};


/* ============ PLATFORM SWITCHER ============ */


function togglePlatformMenu() {
    const menu = document.getElementById('platformSwitcherMenu');
    if (menu) menu.classList.toggle('open');
}

function updatePlatformSwitcher() {
    const existing = document.getElementById('platformSwitcher');
    if (existing) existing.remove();

    if (!STATE.user) return;

    const html = renderPlatformSwitcher();
    if (!html) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstElementChild);
}

function switchPlatform(platformId) {
    const menu = document.getElementById('platformSwitcherMenu');
    if (menu) menu.classList.remove('open');

    switch (platformId) {
        case 'marketplace':
            showToast('🛒 Marketplace', 'info');
            navigateTo('home');
            break;
        case 'seller':
            openSellerPanel();
            break;
        case 'admin':
            showToast('⚙️ Admin Panel (coming next)', 'info');
            if (typeof openAdminPanel === 'function') openAdminPanel();
            break;
        case 'owner':
            showToast('👑 Owner Center (coming next)', 'info');
            break;
    }
}

/* ============ SELLER REGISTRATION ============ */
function openSellerRegistration() {
    if (!STATE.user) {
        showToast('⚠️ Please login first', 'warning');
        setTimeout(() => openAuthModal('login'), 500);
        return;
    }

    // Check if already a seller
    const existingSeller = getSellerByUserId(STATE.user.uid);
    if (existingSeller) {
        showToast('ℹ️ You already have a seller account', 'info');
        openSellerPanel();
        return;
    }

    let modal = document.getElementById('sellerRegModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sellerRegModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content modal-wide">
            <div class="modal-header">
                <h2>🏪 Become a Seller</h2>
                <button class="modal-close" onclick="closeModal('sellerRegModal')">✕</button>
            </div>
            
            <div style="background: linear-gradient(135deg, rgba(212,112,138,0.1), rgba(155,111,168,0.1)); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 0.5rem; color: var(--primary);">Join Velora Marketplace</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Reach thousands of customers, use professional tools, and get guaranteed payments.</p>
            </div>

            <form class="seller-reg-form" onsubmit="handleSellerRegistration(event)">
                
                <h3 class="form-step-title">📋 Store Information</h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Store Name *</label>
                        <input type="text" class="form-input" id="srStoreName" required minlength="3" placeholder="Your store name">
                    </div>
                    <div class="form-group">
                        <label>Store URL (English) *</label>
                        <input type="text" class="form-input" id="srStoreSlug" required pattern="[a-z0-9-]+" placeholder="my-store" title="Lowercase letters, numbers and hyphens only">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Business Phone *</label>
                        <input type="tel" class="form-input" id="srPhone" required placeholder="01xxxxxxxxx">
                    </div>
                    <div class="form-group">
                        <label>Business License # *</label>
                        <input type="text" class="form-input" id="srLicense" required placeholder="License or Tax ID">
                    </div>
                </div>

                <div class="form-group">
                    <label>Store Description</label>
                    <textarea class="form-textarea" id="srDescription" rows="3" placeholder="Describe your store..."></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Main Category *</label>
                        <select class="form-select" id="srCategory" required>
                            <option value="">Select category</option>
                            ${VELORA_PRODUCT_CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${escapeHtml(c.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Product Type *</label>
                        <select class="form-select" id="srProductType" required>
                            <option value="physical">📦 Physical Products</option>
                            <option value="digital">💻 Digital Products</option>
                            <option value="services">🛠️ Services</option>
                        </select>
                    </div>
                </div>

                <h3 class="form-step-title">💎 Choose Your Plan</h3>
                <div class="plans-grid">
                    ${Object.values(SELLER_PLANS).map(plan => `
                        <label class="plan-card">
                            ${plan.id === 'basic' ? '<div class="plan-badge-rec">Recommended</div>' : ''}
                            <input type="radio" name="sellerPlan" value="${plan.id}" ${plan.id === 'basic' ? 'checked' : ''}>
                            <div class="plan-name">${plan.name}</div>
                            <div class="plan-price">${plan.price === 0 ? 'Free' : formatPrice(plan.price) + '/month'}</div>
                            <div class="plan-commission">${plan.commission}% Commission</div>
                            <ul class="plan-features">
                                ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
                            </ul>
                        </label>
                    `).join('')}
                </div>

                <div style="margin-top: 1rem;">
                    <label style="display: flex; align-items: flex-start; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
                        <input type="checkbox" id="srAgree" required style="margin-top: 0.25rem;">
                        <span>I agree to the <a href="#" style="color: var(--primary);">Seller Terms</a> and <a href="#" style="color: var(--primary);">Commission Policy</a> and confirm the accuracy of my data.</span>
                    </label>
                </div>

                <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top: 1rem;">
                    🚀 Submit Application
                </button>
            </form>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function handleSellerRegistration(event) {
    event.preventDefault();

    const storeName = document.getElementById('srStoreName').value.trim();
    const storeSlug = document.getElementById('srStoreSlug').value.trim();
    const phone = document.getElementById('srPhone').value.trim();
    const license = document.getElementById('srLicense').value.trim();
    const description = document.getElementById('srDescription').value.trim();
    const category = document.getElementById('srCategory').value;
    const productType = document.getElementById('srProductType').value;
    const plan = document.querySelector('input[name="sellerPlan"]:checked').value;

    // Check if slug is taken
    const allSellers = getAllSellers();
    if (allSellers.some(s => s.storeSlug === storeSlug)) {
        showToast('❌ Store URL is already taken', 'error');
        return;
    }

    // Create seller
    const sellerId = generateId('seller');
    const seller = {
        id: sellerId,
        userId: STATE.user.uid,
        name: STATE.user.name,
        email: STATE.user.email,
        storeName: storeName,
        storeSlug: storeSlug,
        storeDescription: description,
        storeCategory: category,
        storePhone: phone,
        storeLicense: license,
        storeLogo: '🏪',
        productType: productType,
        plan: plan,
        currency: VELORA_CURRENCY,
        status: SELLER_STATUS.PENDING,
        rating: 0,
        totalReviews: 0,
        totalSales: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalRevenue: 0,
        balance: 0,
        pendingBalance: 0,
        createdAt: Date.now(),
        approvedAt: null,
        rejectionReason: null
    };

    saveSeller(seller);

    // Update user role
    const users = getAllUsersV2();
    const userIdx = users.findIndex(u => u.uid === STATE.user.uid);
    if (userIdx >= 0) {
        users[userIdx].sellerId = sellerId;
        users[userIdx].isSeller = true;
        users[userIdx].roles = [ROLES.CUSTOMER, ROLES.SELLER];
        saveAllUsersV2(users);
    }

    // Update session
    STATE.user.role = ROLES.CUSTOMER;
    STATE.user.roles = [ROLES.CUSTOMER, ROLES.SELLER];
    STATE.user.isSeller = true;
    STATE.user.sellerId = sellerId;
    saveToStorage('maha_user', STATE.user);

    closeModal('sellerRegModal');
    showToast('🎉 Application submitted! We will review within 24 hours.', 'success');

    updateAccountButton();
    updatePlatformSwitcher();

    setTimeout(() => showSellerSuccess(seller), 500);
}

function showSellerSuccess(seller) {
    let modal = document.getElementById('sellerSuccessModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sellerSuccessModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <div style="font-size: 5rem; margin-bottom: 1rem;">🎉</div>
            <h2 style="color: var(--primary); margin-bottom: 1rem;">Application Received!</h2>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
                Your seller application has been submitted. Our team will review it within 24 hours.
            </p>
            <div style="background: var(--bg-alt); padding: 1.5rem; border-radius: 12px; text-align: left; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                    <span style="color: var(--text-muted);">Store:</span>
                    <strong>${escapeHtml(seller.storeName)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                    <span style="color: var(--text-muted);">URL:</span>
                    <code style="background: var(--card); padding: 0.2rem 0.5rem; border-radius: 4px;">/seller/${seller.storeSlug}</code>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                    <span style="color: var(--text-muted);">Plan:</span>
                    <strong>${SELLER_PLANS[seller.plan].name}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Status:</span>
                    <span class="admin-badge admin-badge-warning">⏳ Pending</span>
                </div>
            </div>
            <button class="btn btn-primary btn-block" onclick="closeModal('sellerSuccessModal'); setTimeout(() => { if (typeof window.openSellerPlatform === 'function') { window.openSellerPlatform(); } else { console.error('Seller Dashboard is not available'); showToast('⚠️ Seller Dashboard could not be opened. Please try again.', 'warning'); } }, 100);">
                Go to Seller Dashboard
            </button>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/* ============ OPEN SELLER PANEL (Placeholder - will be expanded in Stage 10) ============ */
function openSellerPanel() {
    const seller = getSellerByUserId(STATE.user?.uid);
    if (seller && STATE.user) { STATE.user.roles = [...new Set([...(STATE.user.roles||[]), 'customer', 'seller'])]; STATE.user.role = 'seller'; saveToStorage(KEYS.USER, STATE.user); }
    
    if (!seller) {
        showToast('⚠️ You are not a seller yet', 'warning');
        setTimeout(openSellerRegistration, 500);
        return;
    }

    showToast('🏪 Seller Dashboard - Coming in next stage', 'info');
    
    // Will be fully implemented in Stage 10
    setTimeout(() => {
        showSellerWelcomeModal(seller);
    }, 500);
}

function showSellerWelcomeModal(seller) {
    let modal = document.getElementById('sellerWelcomeModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sellerWelcomeModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    const statusInfo = SELLER_STATUS_INFO[seller.status] || SELLER_STATUS_INFO[SELLER_STATUS.PENDING] || { label: 'Pending Approval', icon: '⏳', color: '#ff9800' };

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>🏪 ${escapeHtml(seller.storeName)}</h2>
                <button class="modal-close" onclick="closeModal('sellerWelcomeModal')">✕</button>
            </div>
            
            <div style="text-align: center; padding: 2rem 0;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">${statusInfo.icon}</div>
                <h3 style="color: ${statusInfo.color}; margin-bottom: 0.5rem;">${statusInfo.label}</h3>
                <p style="color: var(--text-muted);">
                    ${seller.status === SELLER_STATUS.PENDING ? 
                        'Your application is being reviewed. You will be notified soon.' :
                        seller.status === SELLER_STATUS.APPROVED ?
                        'Your store is active! Start adding products.' :
                        'Status: ' + statusInfo.label
                    }
                </p>
            </div>

            <div style="background: var(--bg-alt); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0;">
                    <span style="color: var(--text-muted);">Plan:</span>
                    <strong>${SELLER_PLANS[seller.plan].name}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0;">
                    <span style="color: var(--text-muted);">Commission:</span>
                    <strong>${SELLER_PLANS[seller.plan].commission}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0;">
                    <span style="color: var(--text-muted);">Product Limit:</span>
                    <strong>${SELLER_PLANS[seller.plan].productLimit === 999999 ? 'Unlimited' : SELLER_PLANS[seller.plan].productLimit}</strong>
                </div>
            </div>

            <button class="btn btn-primary btn-block" onclick="closeModal('sellerWelcomeModal')">
                OK, Got it
            </button>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/* ============ ADD "BECOME SELLER" TO ACCOUNT PAGE ============ */
const originalRenderAccountPage = renderAccountPage;
renderAccountPage = function() {
    const container = document.getElementById('accountContent');
    if (!container) return;

    if (!STATE.user) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <h3>Not logged in</h3>
                <p>Login or create an account to access your profile</p>
                <button class="btn btn-primary btn-lg" onclick="openAuthModal('login')">Login</button>
            </div>
        `;
        return;
    }

    const seller = getSellerByUserId(STATE.user.uid);
    const role = seller ? ROLES.SELLER : (STATE.user.role || ROLES.CUSTOMER);
    const isDualRole = !!(STATE.user.sellerId || seller || STATE.user.isSeller || (Array.isArray(STATE.user.roles) && STATE.user.roles.includes(ROLES.SELLER)));
    const roleInfo = ROLE_INFO[role] || ROLE_INFO[ROLES.CUSTOMER];

    container.innerHTML = `
        <div class="form-section" style="max-width: 700px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; margin: 0 auto 1rem;">
                    ${STATE.user.name.charAt(0).toUpperCase()}
                </div>
                <h2 style="margin-bottom: 0.5rem;">${escapeHtml(STATE.user.name)}</h2>
                <div style="display:flex;justify-content:center;gap:.5rem;flex-wrap:wrap">
                    <span class="role-badge role-customer">👤 Customer</span>
                    ${isDualRole ? '<span class="role-badge role-seller">🏪 Seller</span>' : ''}
                    ${role === ROLES.ADMIN ? '<span class="role-badge role-admin">⚙️ Admin</span>' : ''}
                    ${role === ROLES.OWNER ? '<span class="role-badge role-owner">👑 Platform Owner</span>' : ''}
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
                <label>Name</label>
                <input type="text" class="form-input" value="${escapeHtml(STATE.user.name)}" readonly>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
                <label>Email</label>
                <input type="email" class="form-input" value="${escapeHtml(STATE.user.email)}" readonly>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem;">
                <button class="btn btn-outline" onclick="navigateTo('orders')">📦 My Orders</button>
                <button class="btn btn-outline" onclick="navigateTo('favorites')">❤️ Wishlist</button>
            </div>

            ${!isDualRole && role === ROLES.CUSTOMER ? `
                <div style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(76,175,80,0.1), rgba(139,195,74,0.1)); border-radius: 12px; border: 1px solid rgba(76,175,80,0.3);">
                    <h3 style="margin-bottom: 0.5rem;">🏪 Become a Seller</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                        Start selling on Velora. Reach thousands of customers and grow your business.
                    </p>
                    <button class="btn btn-primary" onclick="openSellerRegistration()">
                        Apply to Sell
                    </button>
                </div>
            ` : ''}

            ${seller ? `
                <div style="margin-top: 1.5rem; padding: 1.5rem; background: var(--bg-alt); border-radius: 12px;">
                    <h3 style="margin-bottom: 0.75rem;">🏪 Your Store</h3>
                    <div style="margin-bottom: 0.75rem;">
                        <strong>${escapeHtml(seller.storeName)}</strong>
                        <span class="admin-badge admin-badge-${seller.status === 'approved' ? 'success' : 'warning'}" style="margin-left: 0.5rem;">
                            ${SELLER_STATUS_INFO[seller.status].label}
                        </span>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="openSellerPanel()">
                        Go to Seller Dashboard
                    </button>
                </div>
            ` : ''}

            <button class="btn btn-outline btn-block" style="margin-top: 1rem; color: var(--error); border-color: var(--error);" onclick="logout()">
                Logout
            </button>
        </div>
    `;
};

/* ============ INIT ============ */
function initRoles() {
    console.log('👥 Initializing roles system...');

    // Ensure default accounts
    getAllUsersV2();

    // Update UI if user logged in
    if (STATE.user) {
        updatePlatformSwitcher();
    }

    console.log('✅ Roles system ready!');
    console.log('📋 Default accounts:');
    console.log('   👑 Owner: owner@maha.com / Maha@Owner2026');
    console.log('   ⚙️ Admin: admin@maha.com / Maha@Admin2026');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initRoles, 500));
} else {
    setTimeout(initRoles, 500);
}

console.log('✅ Roles system loaded!');

/* ============================================
   VELORA - Seller Dashboard
   ============================================ */

console.log('🏪 Loading Seller Dashboard...');

/* ============ PRODUCT STATUS ============ */
const PRODUCT_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    NEEDS_CHANGES: 'needs_changes',
    INACTIVE: 'inactive',
    OUT_OF_STOCK: 'out_of_stock'
};

const PRODUCT_STATUS_INFO = {
    [PRODUCT_STATUS.DRAFT]: { label: 'Draft', icon: '📝', color: '#8b7a90' },
    [PRODUCT_STATUS.PENDING]: { label: 'Pending Review', icon: '⏳', color: '#ff9800' },
    [PRODUCT_STATUS.APPROVED]: { label: 'Approved', icon: '✅', color: '#4caf50' },
    [PRODUCT_STATUS.REJECTED]: { label: 'Rejected', icon: '❌', color: '#f44336' },
    [PRODUCT_STATUS.NEEDS_CHANGES]: { label: 'Needs Changes', icon: '⚠️', color: '#ff5722' },
    [PRODUCT_STATUS.INACTIVE]: { label: 'Inactive', icon: '💤', color: '#8b7a90' },
    [PRODUCT_STATUS.OUT_OF_STOCK]: { label: 'Out of Stock', icon: '📭', color: '#f44336' }
};

/* ============ SELLER STATE ============ */
const SELLER_STATE = {
    currentSection: 'dashboard',
    currentSeller: null
};

/* ============ SELLER PRODUCTS STORAGE ============ */
function getSellerProducts(sellerId) {
    const all = getFromStorage('maha_seller_products', {});
    return all[sellerId] || [];
}

function saveSellerProducts(sellerId, products) {
    const all = getFromStorage('maha_seller_products', {});
    all[sellerId] = products;
    saveToStorage('maha_seller_products', all);
}

function addSellerProduct(sellerId, product) {
    const products = getSellerProducts(sellerId);
    product.id = product.id || generateId('prod');
    product.sellerId = sellerId;
    product.createdAt = Date.now();
    product.updatedAt = Date.now();
    product.status = product.status || PRODUCT_STATUS.PENDING;
    products.push(product);
    saveSellerProducts(sellerId, products);
    return product;
}

function updateSellerProduct(sellerId, productId, updates) {
    const products = getSellerProducts(sellerId);
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) return false;
    products[idx] = { ...products[idx], ...updates, updatedAt: Date.now() };
    saveSellerProducts(sellerId, products);
    return products[idx];
}

function deleteSellerProduct(sellerId, productId) {
    const products = getSellerProducts(sellerId).filter(p => p.id !== productId);
    saveSellerProducts(sellerId, products);
    return true;
}

/* ============ OPEN SELLER PANEL ============ */
function openSellerPlatformCore() {
    if (!STATE.user) {
        showToast('⚠️ Please login first', 'warning');
        return;
    }

    const seller = getSellerByUserId(STATE.user.uid);
    if (!seller) {
        showToast('⚠️ You are not a seller yet', 'warning');
        setTimeout(openSellerRegistration, 500);
        return;
    }

    SELLER_STATE.currentSeller = seller;

    let platform = document.getElementById('sellerPlatform');
    if (!platform) {
        platform = document.createElement('div');
        platform.id = 'sellerPlatform';
        platform.className = 'seller-platform';
        document.body.appendChild(platform);
    }

    platform.innerHTML = renderSellerLayout(seller);
    platform.classList.add('active');
    document.body.style.overflow = 'hidden';

    showSellerSection('dashboard');
}

/* ============ RENDER SELLER LAYOUT ============ */
function renderSellerLayout(seller) {
    const statusInfo = SELLER_STATUS_INFO[seller.status] || SELLER_STATUS_INFO[SELLER_STATUS.PENDING] || { label: 'Pending Approval', icon: '⏳', color: '#ff9800' };

    return `
        <aside class="seller-sidebar" id="sellerSidebar">
            <div class="seller-sidebar-header">
                <div class="seller-store-logo">🏪</div>
                <div class="seller-store-info">
                    <div class="seller-store-name">${escapeHtml(seller.storeName)}</div>
                    <div class="seller-store-sub">Seller Center</div>
                </div>
            </div>

            <nav class="seller-nav">
                <div class="seller-nav-section">
                    <div class="seller-nav-title">Main</div>
                    <div class="seller-nav-item active" data-section="dashboard" onclick="showSellerSection('dashboard', this)">
                        <span>📊</span><span>Dashboard</span>
                    </div>
                    <div class="seller-nav-item" data-section="orders" onclick="showSellerSection('orders', this)">
                        <span>📦</span><span>Orders</span>
                    </div>
                    <div class="seller-nav-item" data-section="products" onclick="showSellerSection('products', this)">
                        <span>🛍️</span><span>Products</span>
                    </div>
                    <div class="seller-nav-item" data-section="inventory" onclick="showSellerSection('inventory', this)">
                        <span>📊</span><span>Inventory</span>
                    </div>
                </div>

                <div class="seller-nav-section">
                    <div class="seller-nav-title">Growth</div>
                    <div class="seller-nav-item" data-section="analytics" onclick="showSellerSection('analytics', this)">
                        <span>📈</span><span>Analytics</span>
                    </div>
                    <div class="seller-nav-item" data-section="earnings" onclick="showSellerSection('earnings', this)">
                        <span>💰</span><span>Earnings</span>
                    </div>
                </div>

                <div class="seller-nav-section">
                    <div class="seller-nav-title">Settings</div>
                    <div class="seller-nav-item" data-section="settings" onclick="showSellerSection('settings', this)">
                        <span>⚙️</span><span>Store Settings</span>
                    </div>
                </div>
            </nav>

            <button class="seller-back-btn" onclick="closeSellerPlatform()">
                <span>⬅️</span><span>Back to Store</span>
            </button>
        </aside>

        <main class="seller-main">
            <header class="seller-header">
                <button class="seller-menu-btn" onclick="toggleSellerSidebar()">☰</button>
                <div class="seller-header-title" id="sellerHeaderTitle">Dashboard</div>
                <div class="seller-header-actions">
                    <div style="padding: 0.35rem 0.85rem; background: ${statusInfo.color}15; color: ${statusInfo.color}; border-radius: 999px; font-size: 0.8rem; font-weight: 800; border: 1px solid ${statusInfo.color};">
                        ${statusInfo.icon} ${statusInfo.label}
                    </div>
                    <button class="seller-icon-btn" onclick="closeSellerPlatform()">🚪</button>
                </div>
            </header>

            <div class="seller-content" id="sellerContent"></div>
        </main>
    `;
}

/* ============ CLOSE SELLER PANEL ============ */
function closeSellerPlatform() {
    const platform = document.getElementById('sellerPlatform');
    if (platform) platform.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleSellerSidebar() {
    const sidebar = document.getElementById('sellerSidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

/* ============ SHOW SELLER SECTION ============ */
function showSellerSection(section, btn) {
    SELLER_STATE.currentSection = section;

    document.querySelectorAll('.seller-nav-item').forEach(item => item.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        orders: 'Orders',
        products: 'Products',
        inventory: 'Inventory',
        analytics: 'Analytics',
        earnings: 'Earnings',
        settings: 'Store Settings'
    };

    const titleEl = document.getElementById('sellerHeaderTitle');
    if (titleEl) titleEl.textContent = titles[section] || section;

    const content = document.getElementById('sellerContent');
    if (!content) return;

    const seller = SELLER_STATE.currentSeller;

    switch(section) {
        case 'dashboard':
            content.innerHTML = renderSellerDashboard(seller);
            break;
        case 'orders':
            content.innerHTML = renderSellerOrders(seller);
            break;
        case 'products':
            content.innerHTML = renderSellerProducts(seller);
            break;
        case 'inventory':
            content.innerHTML = renderSellerInventory(seller);
            break;
        case 'analytics':
            content.innerHTML = renderSellerAnalytics(seller);
            break;
        case 'earnings':
            content.innerHTML = renderSellerEarnings(seller);
            break;
        case 'settings':
            content.innerHTML = renderSellerSettings(seller);
            break;
    }
}

/* ============ RENDER: DASHBOARD ============ */
function renderSellerDashboard(seller) {
    const displayCurrency = getSellerCurrency(seller);
    const products = getSellerProducts(seller.id);
    const orders = getSellerOrders(seller.id);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.sellerEarning || 0), 0);

    return `
        <div class="seller-welcome">
            <h1>Welcome back, ${escapeHtml(seller.name)} 👋</h1>
            <p>Quick overview of your store performance</p>
        </div>

        <div class="seller-kpi-grid">
            <div class="seller-kpi-card" style="border-color: #d4708a;">
                <div class="seller-kpi-icon">🛍️</div>
                <div class="seller-kpi-value" style="color: #d4708a;">${products.length}</div>
                <div class="seller-kpi-label">Products</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #2196f3;">
                <div class="seller-kpi-icon">📦</div>
                <div class="seller-kpi-value" style="color: #2196f3;">${orders.length}</div>
                <div class="seller-kpi-label">Orders</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #4caf50;">
                <div class="seller-kpi-icon">💰</div>
                <div class="seller-kpi-value" style="color: #4caf50; font-size: 1.1rem;">${formatPrice(totalRevenue)}</div>
                <div class="seller-kpi-label">Total Earnings</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #9c27b0;">
                <div class="seller-kpi-icon">⭐</div>
                <div class="seller-kpi-value" style="color: #9c27b0;">${seller.rating || '—'}</div>
                <div class="seller-kpi-label">Store Rating</div>
            </div>
        </div>

        <div class="seller-section-card">
            <h3>⚡ Quick Actions</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
                <button class="btn btn-primary" onclick="openAddProductModal()">➕ Add Product</button>
                <button class="btn btn-outline" onclick="showSellerSection('orders')">📦 View Orders</button>
                <button class="btn btn-outline" onclick="showSellerSection(\'inventory\')">📊 Inventory</button>
                <button class="btn btn-outline" onclick="showSellerSection('earnings')">💰 Earnings</button>
            </div>
        </div>

        <div class="seller-section-card">
            <h3>🕐 Recent Orders</h3>
            ${orders.length === 0 ? `
                <div class="seller-empty">
                    <div class="empty-icon">📭</div>
                    <h4>No orders yet</h4>
                    <p>Your first order will appear here</p>
                </div>
            ` : `
                <div class="seller-table-wrap">
                    <table class="seller-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Your Earnings</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.slice(0, 5).map(o => `
                                <tr>
                                    <td><strong style="color: var(--primary); font-family: monospace;">${o.id}</strong></td>
                                    <td>${escapeHtml(o.customerName || 'N/A')}</td>
                                    <td>${formatPrice(o.total || 0)}</td>
                                    <td><strong style="color: var(--success);">${formatPrice(o.sellerEarning || 0)}</strong></td>
                                    <td><span class="admin-badge admin-badge-warning">${o.status || 'Pending'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

/* ============ RENDER: ORDERS ============ */
function renderSellerOrders(seller) {
    const orders = getSellerOrders(seller.id);

    return `
        <div class="seller-section-card">
            <h3>📦 Your Orders (${orders.length})</h3>
            ${orders.length === 0 ? `
                <div class="seller-empty">
                    <div class="empty-icon">📭</div>
                    <h4>No orders yet</h4>
                    <p>When customers buy your products, orders will appear here</p>
                </div>
            ` : `
                <div class="seller-table-wrap">
                    <table class="seller-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Commission</th>
                                <th>Your Earnings</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(o => `
                                <tr>
                                    <td><strong style="color: var(--primary); font-family: monospace;">${o.id}</strong></td>
                                    <td>${escapeHtml(o.customerName || 'N/A')}</td>
                                    <td>${o.items?.length || 0}</td>
                                    <td>${formatPrice(o.total || 0)}</td>
                                    <td style="color: var(--error);">-${formatPrice(o.commission || 0)}</td>
                                    <td><strong style="color: var(--success);">${formatPrice(o.sellerEarning || 0)}</strong></td>
                                    <td><span class="admin-badge admin-badge-warning">${o.status || 'Pending'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

/* ============ RENDER: PRODUCTS ============ */
function renderSellerProducts(seller) {
    const products = getSellerProducts(seller.id);

    return `
        <div class="seller-section-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                <h3 style="margin: 0;">🛍️ Your Products (${products.length})</h3>
                <button class="btn btn-primary" onclick="openAddProductModal()">➕ Add Product</button>
            </div>

            ${products.length === 0 ? `
                <div class="seller-empty">
                    <div class="empty-icon">📦</div>
                    <h4>No products yet</h4>
                    <p>Start by adding your first product</p>
                    <button class="btn btn-primary" style="margin-top: 1rem;" onclick="openAddProductModal()">
                        ➕ Add First Product
                    </button>
                </div>
            ` : `
                <div class="seller-products-grid">
                    ${products.map(p => renderSellerProductCard(p)).join('')}
                </div>
            `}
        </div>
    `;
}

function renderSellerProductCard(product) {
    const statusInfo = PRODUCT_STATUS_INFO[product.status] || PRODUCT_STATUS_INFO[PRODUCT_STATUS.PENDING];

    return `
        <div class="seller-product-card">
            <div class="seller-product-image">
                ${product.emoji || '📦'}
                <span class="seller-product-status" style="background: ${statusInfo.color};">
                    ${statusInfo.icon} ${statusInfo.label}
                </span>
            </div>
            <div class="seller-product-info">
                <div class="seller-product-name">${escapeHtml(product.name)}</div>
                <div class="seller-product-price">${formatPrice(product.price)}</div>
                <div class="seller-product-stock">📦 Stock: ${product.stock || 0}</div>
                <div class="seller-product-actions">
                    <button onclick="editSellerProduct('${product.id}')">✏️ Edit</button>
                    <button class="danger" onclick="confirmDeleteProduct('${product.id}')">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

/* ============ RENDER: INVENTORY ============ */
function renderSellerInventory(seller) {
    const products = getSellerProducts(seller.id);
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 5).length;
    const outOfStock = products.filter(p => (p.stock || 0) === 0).length;

    return `
        <div class="seller-kpi-grid">
            <div class="seller-kpi-card" style="border-color: #2196f3;">
                <div class="seller-kpi-icon">📦</div>
                <div class="seller-kpi-value" style="color: #2196f3;">${totalStock}</div>
                <div class="seller-kpi-label">Total Stock</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #ff9800;">
                <div class="seller-kpi-icon">⚠️</div>
                <div class="seller-kpi-value" style="color: #ff9800;">${lowStock}</div>
                <div class="seller-kpi-label">Low Stock</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #f44336;">
                <div class="seller-kpi-icon">📭</div>
                <div class="seller-kpi-value" style="color: #f44336;">${outOfStock}</div>
                <div class="seller-kpi-label">Out of Stock</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #4caf50;">
                <div class="seller-kpi-icon">🛍️</div>
                <div class="seller-kpi-value" style="color: #4caf50;">${products.length}</div>
                <div class="seller-kpi-label">Total Products</div>
            </div>
        </div>

        <div class="seller-section-card">
            <h3>📊 Stock Details</h3>
            ${products.length === 0 ? `
                <div class="seller-empty">
                    <div class="empty-icon">📭</div>
                    <h4>No products to show</h4>
                </div>
            ` : `
                <div class="seller-table-wrap">
                    <table class="seller-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(p => {
                                const stockColor = p.stock === 0 ? '#f44336' : p.stock < 5 ? '#ff9800' : '#4caf50';
                                return `
                                    <tr>
                                        <td><strong>${p.emoji} ${escapeHtml(p.name)}</strong></td>
                                        <td>${formatPrice(p.price)}</td>
                                        <td><strong style="color: ${stockColor};">${p.stock || 0}</strong></td>
                                        <td>${p.stock === 0 ? '📭 Out of Stock' : p.stock < 5 ? '⚠️ Low' : '✅ Good'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

/* ============ RENDER: ANALYTICS ============ */
function renderSellerAnalytics(seller) {
    const products = getSellerProducts(seller.id);
    const orders = getSellerOrders(seller.id);

    return `
        <div class="seller-kpi-grid">
            <div class="seller-kpi-card" style="border-color: #2196f3;">
                <div class="seller-kpi-icon">👁️</div>
                <div class="seller-kpi-value" style="color: #2196f3;">0</div>
                <div class="seller-kpi-label">Product Views</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #4caf50;">
                <div class="seller-kpi-icon">🛒</div>
                <div class="seller-kpi-value" style="color: #4caf50;">${orders.length}</div>
                <div class="seller-kpi-label">Total Orders</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #9c27b0;">
                <div class="seller-kpi-icon">💯</div>
                <div class="seller-kpi-value" style="color: #9c27b0;">0%</div>
                <div class="seller-kpi-label">Conversion Rate</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #d4a960;">
                <div class="seller-kpi-icon">📊</div>
                <div class="seller-kpi-value" style="color: #d4a960;">${formatPrice(0)}</div>
                <div class="seller-kpi-label">Avg Order Value</div>
            </div>
        </div>

        <div class="seller-section-card">
            <h3>📈 Analytics</h3>
            <div class="seller-empty">
                <div class="empty-icon">📊</div>
                <h4>Analytics Coming Soon</h4>
                <p>You'll see detailed insights after your first sales</p>
            </div>
        </div>
    `;
}

/* ============ RENDER: EARNINGS ============ */
function renderSellerEarnings(seller) {
    const orders = getSellerOrders(seller.id);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalCommission = orders.reduce((sum, o) => sum + (o.commission || 0), 0);
    const totalEarnings = orders.reduce((sum, o) => sum + (o.sellerEarning || 0), 0);
    const plan = SELLER_PLANS[seller.plan] || SELLER_PLANS.free;

    return `
        <div class="seller-kpi-grid">
            <div class="seller-kpi-card" style="border-color: #2196f3;">
                <div class="seller-kpi-icon">💵</div>
                <div class="seller-kpi-value" style="color: #2196f3; font-size: 1.1rem;">${formatPrice(totalRevenue)}</div>
                <div class="seller-kpi-label">Gross Sales</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #f44336;">
                <div class="seller-kpi-icon">💎</div>
                <div class="seller-kpi-value" style="color: #f44336; font-size: 1.1rem;">-${formatPrice(totalCommission)}</div>
                <div class="seller-kpi-label">Platform Commission</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #4caf50;">
                <div class="seller-kpi-icon">💰</div>
                <div class="seller-kpi-value" style="color: #4caf50; font-size: 1.1rem;">${formatPrice(totalEarnings)}</div>
                <div class="seller-kpi-label">Net Earnings</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #9c27b0;">
                <div class="seller-kpi-icon">📊</div>
                <div class="seller-kpi-value" style="color: #9c27b0;">${plan.commission}%</div>
                <div class="seller-kpi-label">Your Commission Rate</div>
            </div>
        </div>

        <div class="seller-section-card">
            <h3>💰 Earnings Breakdown</h3>
            <div style="padding: 1rem 0;">
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-muted);">Total Sales</span>
                    <strong>${formatPrice(totalRevenue)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-muted);">Platform Fee (${plan.commission}%)</span>
                    <strong style="color: var(--error);">-${formatPrice(totalCommission)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 1rem 0; border-top: 2px dashed var(--border);">
                    <strong>Net Earnings</strong>
                    <strong style="color: var(--success); font-size: 1.2rem;">${formatPrice(totalEarnings)}</strong>
                </div>
            </div>
        </div>
    `;
}

/* ============ RENDER: SETTINGS ============ */
function renderSellerSettings(seller) {
    const activePlan = SELLER_PLANS[seller?.plan] || SELLER_PLANS.free;
    const currency = seller?.currency || VELORA_CURRENCY;
    const currencyOptions = Object.keys(VELORA_CURRENCY_META).map(code => `<option value="${code}" ${code===currency?'selected':''}>${code} — ${VELORA_CURRENCY_META[code].symbol}</option>`).join('');
    return `
        <div class="seller-section-card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
                <div><h3>⚙️ Store Settings</h3><p style="color:var(--text-muted);margin-top:.35rem">Manage your store profile, storefront details and currency.</p></div>
                <button type="button" class="btn btn-primary" onclick="openSellerPlans()">💎 Change Plan</button>
            </div>
            <form class="product-form" id="sellerSettingsForm" onsubmit="saveSellerSettings(event)">
                <div class="form-row">
                    <div class="form-group"><label>Store Name *</label><input class="form-input" id="ssStoreName" type="text" value="${escapeHtml(seller.storeName||'')}" required minlength="3"></div>
                    <div class="form-group"><label>Store URL</label><input class="form-input" value="/seller/${escapeHtml(seller.storeSlug||'')}" readonly></div>
                </div>
                <div class="form-group"><label>Store Description</label><textarea class="form-input" id="ssStoreDescription" rows="4" placeholder="Tell customers about your store">${escapeHtml(seller.storeDescription||'')}</textarea></div>
                <div class="form-row">
                    <div class="form-group"><label>Business Email</label><input class="form-input" type="email" id="ssEmail" value="${escapeHtml(seller.email||'')}" required></div>
                    <div class="form-group"><label>Business Phone</label><input class="form-input" type="tel" id="ssPhone" value="${escapeHtml(seller.storePhone||'')}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Store Currency</label><select class="form-input" id="ssCurrency">${currencyOptions}</select><small style="color:var(--text-muted)">Used for this seller's dashboard and store pricing display.</small></div>
                    <div class="form-group"><label>Marketplace Category</label><select class="form-input" id="ssCategory">${VELORA_PRODUCT_CATEGORIES.map(c=>`<option value="${c.id}" ${c.id===seller.storeCategory?'selected':''}>${c.emoji} ${escapeHtml(c.name)}</option>`).join('')}</select></div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
                    <button type="button" class="btn btn-outline" onclick="showSellerSection('dashboard')">Cancel</button>
                    <button type="submit" class="btn btn-primary">💾 Save Changes</button>
                </div>
            </form>
        </div>
        <div class="seller-section-card" style="margin-top:1rem">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
                <div><h3>💎 Active Plan</h3><p style="color:var(--text-muted);margin-top:.35rem">${escapeHtml(activePlan.name)} — ${activePlan.commission}% commission</p></div>
                <button type="button" class="btn btn-outline" onclick="openSellerPlans()">Change Plan →</button>
            </div>
            <div class="seller-kpi-grid" style="margin-top:1rem">
                <div class="seller-kpi-card"><div class="seller-kpi-icon">🏷️</div><div class="seller-kpi-value">${escapeHtml(activePlan.name)}</div><div class="seller-kpi-label">Plan</div></div>
                <div class="seller-kpi-card"><div class="seller-kpi-icon">📦</div><div class="seller-kpi-value">${activePlan.productLimit>=999999?'∞':activePlan.productLimit}</div><div class="seller-kpi-label">Product Limit</div></div>
                <div class="seller-kpi-card"><div class="seller-kpi-icon">💰</div><div class="seller-kpi-value">${activePlan.commission}%</div><div class="seller-kpi-label">Commission</div></div>
                <div class="seller-kpi-card"><div class="seller-kpi-icon">💳</div><div class="seller-kpi-value">${activePlan.price===0?'Free':formatPrice(activePlan.price)}</div><div class="seller-kpi-label">Monthly Price</div></div>
            </div>
        </div>
    `;
}

function saveSellerSettings(event) {
    event.preventDefault();
    const seller = SELLER_STATE.currentSeller;
    if (!seller) { showToast('⚠️ Seller profile not found.','warning'); return; }
    const storeName = document.getElementById('ssStoreName')?.value.trim();
    const storeDescription = document.getElementById('ssStoreDescription')?.value.trim() || '';
    const email = document.getElementById('ssEmail')?.value.trim();
    const phone = document.getElementById('ssPhone')?.value.trim() || '';
    const currency = document.getElementById('ssCurrency')?.value || VELORA_CURRENCY;
    const storeCategory = document.getElementById('ssCategory')?.value || 'other';
    if (!storeName || storeName.length < 3) { showToast('⚠️ Store name must be at least 3 characters.','warning'); return; }
    if (!email) { showToast('⚠️ Business email is required.','warning'); return; }
    seller.storeName = storeName;
    seller.storeDescription = storeDescription;
    seller.email = email;
    seller.storePhone = phone;
    seller.currency = currency;
    seller.storeCategory = storeCategory;
    setVeloraCurrency(currency);
    saveSeller(seller);
    SELLER_STATE.currentSeller = seller;
    showToast('✅ Store settings saved successfully.','success');
    showSellerSection('settings');
}

/* ============ SELLER ORDERS STORAGE ============ */
function getSellerOrders(sellerId) {
    const allOrders = getOrders();
    return allOrders.filter(order => {
        return order.items?.some(item => item.sellerId === sellerId);
    }).map(order => {
        // حساب أرباح البائع
        const sellerItems = order.items.filter(i => i.sellerId === sellerId);
        const sellerTotal = sellerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const commission = sellerTotal * 0.15; // 15% افتراضي
        const sellerEarning = sellerTotal - commission;

        return {
            id: order.id,
            customerName: order.customer?.name || 'Customer',
            items: sellerItems,
            total: sellerTotal,
            commission: commission,
            sellerEarning: sellerEarning,
            status: order.status || 'Pending'
        };
    });
}

/* ============ ADD PRODUCT MODAL ============ */
function openAddProductModal(editId) {
    const seller = SELLER_STATE.currentSeller;
    if (!seller) { showToast('⚠️ Seller profile not found.', 'warning'); return; }
    let modal = document.getElementById('addProductModal');
    if (!modal) { modal = document.createElement('div'); modal.id='addProductModal'; modal.className='modal'; document.body.appendChild(modal); }
    const existing = editId ? getSellerProducts(seller.id).find(p => String(p.id) === String(editId)) : null;
    const categories = VELORA_PRODUCT_CATEGORIES;
    modal.innerHTML = `
      <div class="modal-content modal-wide">
        <div class="modal-header">
          <h2>${existing ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
          <button type="button" class="modal-close" aria-label="Close" onclick="closeModal('addProductModal')">✕</button>
        </div>
        <form class="product-form" id="sellerProductForm" onsubmit="handleAddProduct(event, ${existing ? `'${String(existing.id).replace(/'/g,"\\'")}'` : 'null'})" novalidate>
          <div class="form-row">
            <div class="form-group"><label>Product Name *</label><input class="form-input" id="apName" required minlength="3" value="${escapeHtml(existing?.name||'')}" placeholder="Product name"></div>
            <div class="form-group"><label>Brand *</label><input class="form-input" id="apBrand" required value="${escapeHtml(existing?.brand||'')}" placeholder="Brand"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Category *</label><select class="form-input" id="apCategory" required><option value="">Select category</option>${categories.map(c=>`<option value="${escapeHtml(c.id)}" ${String(existing?.category||'')===String(c.id)?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select></div>
            <div class="form-group"><label>Subcategory</label><input class="form-input" id="apSubcategory" value="${escapeHtml(existing?.subcategory||'')}" placeholder="Optional"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Price *</label><input class="form-input" type="number" id="apPrice" min="0.01" step="0.01" required value="${Number(existing?.price||'')||''}"></div>
            <div class="form-group"><label>Old Price</label><input class="form-input" type="number" id="apOldPrice" min="0" step="0.01" value="${Number(existing?.oldPrice||'')||''}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Stock *</label><input class="form-input" type="number" id="apStock" min="0" step="1" required value="${Number.isFinite(Number(existing?.stock))?Number(existing.stock):50}"></div>
            <div class="form-group"><label>Product Icon</label><input class="form-input" id="apEmoji" maxlength="5" value="${escapeHtml(existing?.emoji||'📦')}" style="text-align:center;font-size:1.35rem"></div>
          </div>
          <div class="form-group"><label>Description *</label><textarea class="form-input" id="apDescription" required rows="4" placeholder="Describe the product">${escapeHtml(existing?.description||'')}</textarea></div>
          <div class="form-group">
            <label>Product Image <span style="color:var(--error)">*</span></label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start">
              <div><input class="form-input" type="file" id="apImageFile" accept="image/*"><small style="color:var(--text-muted)">Upload from your device (max 5 MB).</small></div>
              <div><input class="form-input" type="url" id="apImageUrl" value="${escapeHtml(existing?.imageUrl||existing?.image||'')}" placeholder="https://..." ><small style="color:var(--text-muted)">Optional URL. One image source is enough.</small></div>
            </div>
            <div id="apImagePreview" style="margin-top:12px;min-height:120px;border:1px dashed var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--bg-alt)"></div>
          </div>
          <div class="form-group"><label>Tags</label><input class="form-input" id="apTags" value="${escapeHtml((existing?.tags||[]).join(', '))}" placeholder="tag1, tag2"></div>
          <div id="apFormError" style="display:none;color:var(--error);background:rgba(244,67,54,.08);padding:.8rem;border-radius:10px;margin-bottom:1rem"></div>
          <div style="display:flex;gap:.75rem;justify-content:flex-end"><button type="button" class="btn btn-outline" onclick="closeModal('addProductModal')">Cancel</button><button type="submit" class="btn btn-primary">${existing?'💾 Save Changes':'✅ Add Product'}</button></div>
        </form>
      </div>`;
    modal.classList.add('active');
    document.body.style.overflow='hidden';
    const preview=document.getElementById('apImagePreview');
    const showPreview=(src)=>{ if(preview) preview.innerHTML=src?`<img src="${src}" alt="Preview" style="max-height:180px;max-width:100%;object-fit:contain">`:'<span style="color:var(--text-muted)">Image preview</span>'; };
    const existingImage=existing?.imageUrl||existing?.image||''; if(existingImage) showPreview(existingImage);
    const fileInput=document.getElementById('apImageFile');
    if(fileInput) fileInput.addEventListener('change',()=>{ const file=fileInput.files?.[0]; if(!file)return; if(!file.type.startsWith('image/')){fileInput.value='';showPreview(existingImage);return;} if(file.size>5*1024*1024){fileInput.value='';showPreview(existingImage);showToast('⚠️ Image must be 5 MB or smaller.','warning');return;} const reader=new FileReader(); reader.onload=e=>showPreview(String(e.target.result||'')); reader.readAsDataURL(file); });
    const urlInput=document.getElementById('apImageUrl'); if(urlInput) urlInput.addEventListener('input',()=>{if(!fileInput?.files?.length)showPreview(urlInput.value.trim());});
}


async function handleAddProduct(event, editId) {
    event.preventDefault();
    const seller = SELLER_STATE.currentSeller;
    if (!seller) return;
    const errorEl=document.getElementById('apFormError'); const fail=(m)=>{if(errorEl){errorEl.textContent=m;errorEl.style.display='block';}showToast(m,'warning');};
    const name=document.getElementById('apName')?.value.trim();
    const brand=document.getElementById('apBrand')?.value.trim();
    const category=document.getElementById('apCategory')?.value;
    const price=Number(document.getElementById('apPrice')?.value);
    const oldPriceRaw=Number(document.getElementById('apOldPrice')?.value);
    const stock=Number(document.getElementById('apStock')?.value);
    const description=document.getElementById('apDescription')?.value.trim();
    if(!name||name.length<3) return fail('⚠️ Enter a valid product name.');
    if(!brand) return fail('⚠️ Enter the brand name.');
    if(!category) return fail('⚠️ Select a category.');
    if(!Number.isFinite(price)||price<=0) return fail('⚠️ Enter a valid price.');
    if(!Number.isInteger(stock)||stock<0) return fail('⚠️ Enter a valid stock quantity.');
    if(!description) return fail('⚠️ Add a product description.');
    const file=document.getElementById('apImageFile')?.files?.[0]||null;
    const url=document.getElementById('apImageUrl')?.value.trim()||'';
    let imageUrl=url;
    if(file){ if(!file.type.startsWith('image/'))return fail('⚠️ Please select an image file.'); if(file.size>5*1024*1024)return fail('⚠️ Image must be 5 MB or smaller.'); imageUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file);}); }
    const oldPrice=Number.isFinite(oldPriceRaw)&&oldPriceRaw>0?oldPriceRaw:null;
    const tags=(document.getElementById('apTags')?.value||'').split(',').map(x=>x.trim()).filter(Boolean);
    const emoji=(document.getElementById('apEmoji')?.value||'📦').trim()||'📦';
    const products=getSellerProducts(seller.id).slice();
    let product=editId?products.find(p=>String(p.id)===String(editId)):null;
    if(editId&&!product)return fail('❌ Product not found.');
    const data={name,brand,category,subcategory:document.getElementById('apSubcategory')?.value.trim()||'General',price,oldPrice,emoji,stock,description,tags,rating:product?.rating||5,reviewsCount:product?.reviewsCount||0,status:product?.status||PRODUCT_STATUS.PENDING,imageUrl:imageUrl||product?.imageUrl||product?.image||''};
    if(!data.imageUrl)return fail('⚠️ Add a product image by uploading a file or providing an image URL.');
    if(product){Object.assign(product,data,{updatedAt:Date.now()});saveSellerProducts(seller.id,products);}
    else { addSellerProduct(seller.id,data); }
    seller.totalProducts=getSellerProducts(seller.id).length; saveSeller(seller); closeModal('addProductModal'); showToast(editId?'✅ Product updated successfully.':'✅ Product added and sent for review.','success'); setTimeout(()=>showSellerSection('products'),150);
}


function editSellerProduct(productId) {
    if (!SELLER_STATE.currentSeller) { showToast('⚠️ Seller profile not found.', 'warning'); return; }
    openAddProductModal(productId);
}

function confirmDeleteProduct(productId) {
    if (!confirm('Delete this product?')) return;
    const seller = SELLER_STATE.currentSeller;
    deleteSellerProduct(seller.id, productId);
    showToast('🗑️ Product deleted', 'info');
    showSellerSection('products');
}

/* ============ UPDATE MAHA API ============ */
// Always route legacy and new seller actions to the real Seller Dashboard
window.openSellerPanel = function() { return openSellerPlatformCore(); };
window.openSellerPlatform = function() { return openSellerPlatformCore(); };
window.closeSellerPlatform = closeSellerPlatform;
window.showSellerSection = showSellerSection;

/* ============ INIT ============ */
console.log('✅ Seller Dashboard loaded!');

/* ============================================
   VELORA - Admin Panel
   ============================================ */

console.log('⚙️ Loading Admin Panel...');

/* ============ ADMIN STATE ============ */
const ADMIN_STATE = {
    currentSection: 'dashboard',
    currentTab: 'all'
};

/* ============ OPEN ADMIN PANEL ============ */
function openAdminPlatform() {
    if (!STATE.user) {
        showToast('⚠️ Please login first', 'warning');
        return;
    }

    if (STATE.user.role !== ROLES.ADMIN && STATE.user.role !== ROLES.OWNER) {
        showToast('🔒 Admin access only', 'error');
        return;
    }

    let platform = document.getElementById('adminPlatform');
    if (!platform) {
        platform = document.createElement('div');
        platform.id = 'adminPlatform';
        platform.className = 'admin-platform';
        document.body.appendChild(platform);
    }

    platform.innerHTML = renderAdminLayout();
    platform.classList.add('active');
    document.body.style.overflow = 'hidden';

    showAdminSection('dashboard');
}

/* ============ RENDER ADMIN LAYOUT ============ */
function renderAdminLayout() {
    const pendingSellers = getAllSellers().filter(s => s.status === SELLER_STATUS.PENDING).length;
    const pendingProducts = getAllSellerProductsCount();
    const totalOrders = getOrders().length;

    return `
        <aside class="admin-sidebar" id="adminSidebar">
            <div class="admin-sidebar-header">
                <div class="admin-logo">⚙️</div>
                <div class="admin-store-info">
                    <div class="admin-store-name">Admin Panel</div>
                    <div class="admin-store-sub">Velora</div>
                </div>
            </div>

            <nav class="admin-nav">
                <div class="admin-nav-section">
                    <div class="admin-nav-title">Overview</div>
                    <div class="admin-nav-item active" data-section="dashboard" onclick="showAdminSection('dashboard', this)">
                        <span>📊</span><span>Dashboard</span>
                    </div>
                </div>

                <div class="admin-nav-section">
                    <div class="admin-nav-title">Management</div>
                    <div class="admin-nav-item" data-section="sellers" onclick="showAdminSection('sellers', this)">
                        <span>🏪</span><span>Sellers</span>
                        ${pendingSellers > 0 ? `<span class="nav-badge">${pendingSellers}</span>` : ''}
                    </div>
                    <div class="admin-nav-item" data-section="products" onclick="showAdminSection('products', this)">
                        <span>📦</span><span>Products</span>
                        ${pendingProducts > 0 ? `<span class="nav-badge">${pendingProducts}</span>` : ''}
                    </div>
                    <div class="admin-nav-item" data-section="orders" onclick="showAdminSection('orders', this)">
                        <span>🛒</span><span>Orders</span>
                        ${totalOrders > 0 ? `<span class="nav-badge">${totalOrders}</span>` : ''}
                    </div>
                    <div class="admin-nav-item" data-section="users" onclick="showAdminSection('users', this)">
                        <span>👥</span><span>Users</span>
                    </div>
                </div>

                <div class="admin-nav-section">
                    <div class="admin-nav-title">System</div>
                    <div class="admin-nav-item" data-section="coupons" onclick="showAdminSection('coupons', this)">
                        <span>🎟️</span><span>Coupons</span>
                    </div>
                    <div class="admin-nav-item" data-section="settings" onclick="showAdminSection('settings', this)">
                        <span>⚙️</span><span>Settings</span>
                    </div>
                </div>
            </nav>

            <button class="admin-back-btn" onclick="closeAdminPlatform()">
                <span>⬅️</span><span>Back to Store</span>
            </button>
        </aside>

        <main class="admin-main">
            <header class="admin-header">
                <button class="admin-menu-btn" onclick="toggleAdminSidebar()">☰</button>
                <div class="admin-header-title" id="adminHeaderTitle">Dashboard</div>
                <div class="admin-header-actions">
                    <button class="admin-icon-btn" onclick="closeAdminPlatform()">🚪</button>
                </div>
            </header>

            <div class="admin-content" id="adminContent"></div>
        </main>
    `;
}

/* ============ CLOSE ADMIN PANEL ============ */
function closeAdminPlatform() {
    const platform = document.getElementById('adminPlatform');
    if (platform) platform.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleAdminSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

/* ============ COUNT PENDING PRODUCTS ============ */
function getAllSellerProductsCount() {
    const all = getFromStorage('maha_seller_products', {});
    let count = 0;
    Object.values(all).forEach(arr => {
        if (Array.isArray(arr)) {
            count += arr.filter(p => p.status === PRODUCT_STATUS.PENDING).length;
        }
    });
    return count;
}

/* ============ SHOW ADMIN SECTION ============ */
function showAdminSection(section, btn) {
    ADMIN_STATE.currentSection = section;

    document.querySelectorAll('.admin-nav-item').forEach(item => item.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        sellers: 'Sellers',
        products: 'Products',
        orders: 'Orders',
        users: 'Users',
        coupons: 'Coupons',
        settings: 'Settings'
    };

    const titleEl = document.getElementById('adminHeaderTitle');
    if (titleEl) titleEl.textContent = titles[section] || section;

    const content = document.getElementById('adminContent');
    if (!content) return;

    switch(section) {
        case 'dashboard':
            content.innerHTML = renderAdminDashboard();
            break;
        case 'sellers':
            content.innerHTML = renderAdminSellers();
            break;
        case 'products':
            content.innerHTML = renderAdminProducts();
            break;
        case 'orders':
            content.innerHTML = renderAdminOrders();
            break;
        case 'users':
            content.innerHTML = renderAdminUsers();
            break;
        case 'coupons':
            content.innerHTML = renderAdminCoupons();
            break;
        case 'settings':
            content.innerHTML = renderAdminSettings();
            break;
    }
}

/* ============ RENDER: DASHBOARD ============ */
function renderAdminDashboard() {
    const sellers = getAllSellers();
    const orders = getOrders();
    const users = getAllUsersV2();
    const pendingSellers = sellers.filter(s => s.status === SELLER_STATUS.PENDING).length;
    const pendingProducts = getAllSellerProductsCount();
    
    let totalRevenue = 0;
    orders.forEach(o => { totalRevenue += o.total || 0; });

    return `
        <div class="admin-kpi-grid">
            <div class="admin-kpi-card" style="border-color: #4caf50;">
                <div class="admin-kpi-icon">🏪</div>
                <div class="admin-kpi-value" style="color: #4caf50;">${sellers.length}</div>
                <div class="admin-kpi-label">Total Sellers</div>
            </div>
            <div class="admin-kpi-card" style="border-color: #ff9800;">
                <div class="admin-kpi-icon">⏳</div>
                <div class="admin-kpi-value" style="color: #ff9800;">${pendingSellers}</div>
                <div class="admin-kpi-label">Pending Sellers</div>
            </div>
            <div class="admin-kpi-card" style="border-color: #2196f3;">
                <div class="admin-kpi-icon">📦</div>
                <div class="admin-kpi-value" style="color: #2196f3;">${pendingProducts}</div>
                <div class="admin-kpi-label">Pending Products</div>
            </div>
            <div class="admin-kpi-card" style="border-color: #d4708a;">
                <div class="admin-kpi-icon">👥</div>
                <div class="admin-kpi-value" style="color: #d4708a;">${users.length}</div>
                <div class="admin-kpi-label">Total Users</div>
            </div>
            <div class="admin-kpi-card" style="border-color: #9c27b0;">
                <div class="admin-kpi-icon">🛒</div>
                <div class="admin-kpi-value" style="color: #9c27b0;">${orders.length}</div>
                <div class="admin-kpi-label">Total Orders</div>
            </div>
            <div class="admin-kpi-card" style="border-color: #4caf50;">
                <div class="admin-kpi-icon">💰</div>
                <div class="admin-kpi-value" style="color: #4caf50; font-size: 1.1rem;">${formatPrice(totalRevenue)}</div>
                <div class="admin-kpi-label">Total Revenue</div>
            </div>
        </div>

        <div class="admin-section-card">
            <h3>⚡ Quick Actions</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
                <button class="btn btn-primary" onclick="showAdminSection('sellers')">
                    🏪 Review Sellers ${pendingSellers > 0 ? '(' + pendingSellers + ')' : ''}
                </button>
                <button class="btn btn-outline" onclick="showAdminSection('products')">
                    📦 Review Products ${pendingProducts > 0 ? '(' + pendingProducts + ')' : ''}
                </button>
                <button class="btn btn-outline" onclick="showAdminSection('orders')">
                    🛒 View Orders
                </button>
                <button class="btn btn-outline" onclick="showAdminSection('users')">
                    👥 View Users
                </button>
            </div>
        </div>

        <div class="admin-section-card">
            <h3>🕐 Recent Orders</h3>
            ${orders.length === 0 ? `
                <div class="admin-empty">
                    <div class="empty-icon">📭</div>
                    <h4>No orders yet</h4>
                </div>
            ` : `
                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.slice(0, 10).map(o => `
                                <tr>
                                    <td><strong style="color: var(--primary); font-family: monospace;">${o.id}</strong></td>
                                    <td>${escapeHtml(o.customer?.name || 'N/A')}</td>
                                    <td>${o.items?.length || 0}</td>
                                    <td><strong>${formatPrice(o.total)}</strong></td>
                                    <td>${o.payment || 'COD'}</td>
                                    <td>${new Date(o.date).toLocaleDateString('en-US')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

/* ============ RENDER: SELLERS ============ */
function renderAdminSellers() {
    const sellers = getAllSellers();

    return `
        <div class="admin-tabs">
            <button class="admin-tab active" onclick="filterAdminSellers('all', this)">All (${sellers.length})</button>
            <button class="admin-tab" onclick="filterAdminSellers('pending', this)">⏳ Pending (${sellers.filter(s => s.status === SELLER_STATUS.PENDING).length})</button>
            <button class="admin-tab" onclick="filterAdminSellers('approved', this)">✅ Approved (${sellers.filter(s => s.status === SELLER_STATUS.APPROVED).length})</button>
            <button class="admin-tab" onclick="filterAdminSellers('rejected', this)">❌ Rejected (${sellers.filter(s => s.status === SELLER_STATUS.REJECTED).length})</button>
        </div>

        <div class="admin-section-card">
            ${sellers.length === 0 ? `
                <div class="admin-empty">
                    <div class="empty-icon">🏪</div>
                    <h4>No sellers yet</h4>
                </div>
            ` : `
                <div class="admin-table-wrap">
                    <table class="admin-table" id="sellersTable">
                        <thead>
                            <tr>
                                <th>Store</th>
                                <th>Owner</th>
                                <th>Email</th>
                                <th>Category</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sellers.map(s => {
                                const statusInfo = SELLER_STATUS_INFO[s.status];
                                return `
                                    <tr data-status="${s.status}">
                                        <td><strong>🏪 ${escapeHtml(s.storeName)}</strong></td>
                                        <td>${escapeHtml(s.name)}</td>
                                        <td>${escapeHtml(s.email)}</td>
                                        <td>${escapeHtml(s.storeCategory || 'N/A')}</td>
                                        <td>${SELLER_PLANS[s.plan]?.name || 'Free'}</td>
                                        <td>
                                            <span class="admin-badge" style="background: ${statusInfo.color}20; color: ${statusInfo.color};">
                                                ${statusInfo.icon} ${statusInfo.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                                                ${s.status === SELLER_STATUS.PENDING ? `
                                                    <button class="admin-action-btn success" onclick="approveSeller('${s.id}')">✅ Approve</button>
                                                    <button class="admin-action-btn danger" onclick="rejectSeller('${s.id}')">❌ Reject</button>
                                                ` : ''}
                                                ${s.status === SELLER_STATUS.APPROVED ? `
                                                    <button class="admin-action-btn danger" onclick="suspendSeller('${s.id}')">🚫 Suspend</button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function filterAdminSellers(status, btn) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const rows = document.querySelectorAll('#sellersTable tbody tr');
    rows.forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/* ============ SELLER ACTIONS ============ */
function approveSeller(sellerId) {
    const seller = getSellerById(sellerId);
    if (!seller) return;

    seller.status = SELLER_STATUS.APPROVED;
    seller.approvedAt = Date.now();
    saveSeller(seller);

    showToast('✅ Seller approved!', 'success');
    showAdminSection('sellers');
}

function rejectSeller(sellerId) {
    const reason = prompt('Rejection reason (optional):');
    if (reason === null) return;

    const seller = getSellerById(sellerId);
    if (!seller) return;

    seller.status = SELLER_STATUS.REJECTED;
    seller.rejectionReason = reason;
    saveSeller(seller);

    showToast('❌ Seller rejected', 'info');
    showAdminSection('sellers');
}

function suspendSeller(sellerId) {
    if (!confirm('Suspend this seller?')) return;

    const seller = getSellerById(sellerId);
    if (!seller) return;

    seller.status = SELLER_STATUS.SUSPENDED;
    saveSeller(seller);

    showToast('🚫 Seller suspended', 'info');
    showAdminSection('sellers');
}

/* ============ RENDER: PRODUCTS ============ */
function renderAdminProducts() {
    const allProducts = [];
    const sellerProducts = getFromStorage('maha_seller_products', {});
    
    Object.keys(sellerProducts).forEach(sellerId => {
        const seller = getSellerById(sellerId);
        sellerProducts[sellerId].forEach(p => {
            allProducts.push({ ...p, sellerName: seller?.storeName || 'Unknown' });
        });
    });

    const pending = allProducts.filter(p => p.status === PRODUCT_STATUS.PENDING);

    return `
        <div class="admin-tabs">
            <button class="admin-tab active" onclick="filterAdminProducts('all', this)">All (${allProducts.length})</button>
            <button class="admin-tab" onclick="filterAdminProducts('pending_review', this)">⏳ Pending (${pending.length})</button>
            <button class="admin-tab" onclick="filterAdminProducts('approved', this)">✅ Approved (${allProducts.filter(p => p.status === PRODUCT_STATUS.APPROVED).length})</button>
            <button class="admin-tab" onclick="filterAdminProducts('rejected', this)">❌ Rejected (${allProducts.filter(p => p.status === PRODUCT_STATUS.REJECTED).length})</button>
        </div>

        <div class="admin-section-card">
            ${allProducts.length === 0 ? `
                <div class="admin-empty">
                    <div class="empty-icon">📦</div>
                    <h4>No products from sellers yet</h4>
                </div>
            ` : `
                <div class="admin-table-wrap">
                    <table class="admin-table" id="productsTable">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Seller</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allProducts.map(p => {
                                const statusInfo = PRODUCT_STATUS_INFO[p.status] || PRODUCT_STATUS_INFO[PRODUCT_STATUS.PENDING];
                                return `
                                    <tr data-status="${p.status}">
                                        <td><strong>${p.emoji || '📦'} ${escapeHtml(p.name)}</strong></td>
                                        <td>${escapeHtml(p.sellerName)}</td>
                                        <td>${escapeHtml(p.subcategory || 'N/A')}</td>
                                        <td>${formatPrice(p.price)}</td>
                                        <td>${p.stock || 0}</td>
                                        <td>
                                            <span class="admin-badge" style="background: ${statusInfo.color}20; color: ${statusInfo.color};">
                                                ${statusInfo.icon} ${statusInfo.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                                                ${p.status === PRODUCT_STATUS.PENDING ? `
                                                    <button class="admin-action-btn success" onclick="approveProduct('${p.sellerId}', '${p.id}')">✅</button>
                                                    <button class="admin-action-btn danger" onclick="rejectProduct('${p.sellerId}', '${p.id}')">❌</button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function filterAdminProducts(status, btn) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const rows = document.querySelectorAll('#productsTable tbody tr');
    rows.forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function approveProduct(sellerId, productId) {
    updateSellerProduct(sellerId, productId, { status: PRODUCT_STATUS.APPROVED });
    showToast('✅ Product approved!', 'success');
    showAdminSection('products');
}

function rejectProduct(sellerId, productId) {
    updateSellerProduct(sellerId, productId, { status: PRODUCT_STATUS.REJECTED });
    showToast('❌ Product rejected', 'info');
    showAdminSection('products');
}

/* ============ ADMIN ORDER LIFECYCLE — SPRINT 2.5 ============ */
const ADMIN_ORDER_TRANSITIONS = Object.freeze({
    pending: Object.freeze(['confirmed', 'cancelled']),
    confirmed: Object.freeze(['processing', 'cancelled']),
    processing: Object.freeze(['shipped', 'cancelled']),
    shipped: Object.freeze(['delivered', 'cancelled']),
    delivered: Object.freeze(['refunded']),
    cancelled: Object.freeze([]),
    refunded: Object.freeze([])
});

function normalizeAdminOrderStatus(status) {
    return String(status || 'pending').trim().toLowerCase();
}

function adminOrderStatusLabel(status) {
    const value = normalizeAdminOrderStatus(status);
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function isAdminOrderUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function adminOrderMoney(amount, currency) {
    const value = Number(amount || 0);
    const code = String(currency || window.VELORA_CURRENCY || 'EGP').toUpperCase();
    return code + ' ' + (Number.isFinite(value) ? value.toFixed(2) : '0.00');
}

function adminOrderDisplayId(order) {
    return order?.order_number ?? order?.orderNumber ?? order?.id ?? 'N/A';
}

function adminOrderRpcCode(error) {
    const raw = String(error?.message || error?.details || error?.hint || '');
    const codes = [
        'INVALID_TRANSITION',
        'FORBIDDEN',
        'ORDER_NOT_FOUND',
        'AUTH_REQUIRED',
        'NOTE_TOO_LONG',
        'ORDER_ID_REQUIRED',
        'INVALID_STATUS'
    ];
    return codes.find(code => raw.includes(code)) || 'UNKNOWN';
}

function ensureAdminOrderLifecycleModals() {
    if (document.getElementById('adminOrderDetailsModal')) return;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal" id="adminOrderDetailsModal">
            <div class="modal-content modal-wide" style="max-width: 900px;">
                <div class="modal-header">
                    <h2 id="adminOrderDetailsTitle">🛒 Order Details</h2>
                    <button class="modal-close" onclick="closeModal('adminOrderDetailsModal')">✕</button>
                </div>
                <div id="adminOrderDetailsContent"></div>
            </div>
        </div>

        <div class="modal" id="adminOrderConfirmModal">
            <div class="modal-content" style="max-width: 520px;">
                <div class="modal-header">
                    <h2>Confirm Status Change</h2>
                    <button class="modal-close" onclick="closeModal('adminOrderConfirmModal')">✕</button>
                </div>
                <div id="adminOrderConfirmContent"></div>
            </div>
        </div>
    `);
}

async function loadAdminOrderDetails(orderRef) {
    const orders = getOrders();
    const localOrder = orders.find(order =>
        String(order.id) === String(orderRef) ||
        String(order.order_number ?? order.orderNumber ?? '') === String(orderRef)
    ) || null;

    const client = window.mahaSupabase;
    let dbOrder = null;
    let dbItems = [];
    let dbPayment = null;

    if (client) {
        try {
            let query = client
                .from('orders')
                .select('id,order_number,status,subtotal,discount,shipping,total,currency,payment_status,customer_id,customer_name,customer_phone,customer_email,customer_city,customer_address,customer_notes,created_at,updated_at,checkout_reference')
                .limit(1);

            if (isAdminOrderUuid(localOrder?.id)) {
                query = query.eq('id', localOrder.id);
            } else if (isAdminOrderUuid(localOrder?.order_id)) {
                query = query.eq('id', localOrder.order_id);
            } else if (/^\d+$/.test(String(orderRef || ''))) {
                query = query.eq('order_number', Number(orderRef));
            } else if (localOrder?.order_number != null || localOrder?.orderNumber != null) {
                query = query.eq('order_number', Number(localOrder.order_number ?? localOrder.orderNumber));
            } else if (isAdminOrderUuid(orderRef)) {
                query = query.eq('id', orderRef);
            } else {
                query = null;
            }

            if (query) {
                const { data, error } = await query.maybeSingle();
                if (!error && data) {
                    dbOrder = data;

                    const itemsResult = await client
                        .from('order_items')
                        .select('id,product_name,quantity,unit_price,subtotal,store_name,product_variant_name,sku,product_variant_attributes')
                        .eq('order_id', data.id)
                        .order('created_at', { ascending: true });

                    if (!itemsResult.error && Array.isArray(itemsResult.data)) {
                        dbItems = itemsResult.data;
                    }

                    const paymentResult = await client
                        .from('payments')
                        .select('id,method,provider,amount,currency,status')
                        .eq('order_id', data.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!paymentResult.error) dbPayment = paymentResult.data || null;
                }
            }
        } catch (error) {
            console.warn('Velora admin order details fetch:', error);
        }
    }

    return dbOrder ? {
        ...(localOrder || {}),
        ...dbOrder,
        items: dbItems.length ? dbItems : (localOrder?.items || []),
        payment: dbPayment?.method || localOrder?.payment || localOrder?.paymentMethod || 'COD',
        payment_record: dbPayment
    } : localOrder;
}

function renderAdminOrderDetailsContent(order) {
    if (!order) {
        return `
            <div class="admin-empty" style="padding: 2rem;">
                <div class="empty-icon">❓</div>
                <h4>Order not found</h4>
            </div>
        `;
    }

    const status = normalizeAdminOrderStatus(order.status);
    const items = Array.isArray(order.items) ? order.items : [];
    const customer = order.customer || {};
    const customerName = order.customer_name || customer.name || 'N/A';
    const customerPhone = order.customer_phone || customer.phone || 'N/A';
    const customerEmail = order.customer_email || customer.email || 'N/A';
    const customerCity = order.customer_city || customer.city || 'N/A';
    const customerAddress = order.customer_address || customer.address || 'N/A';
    const total = order.total ?? 0;
    const currency = order.currency || window.VELORA_CURRENCY || 'EGP';
    const transitions = ADMIN_ORDER_TRANSITIONS[status] || [];

    const itemRows = items.length ? items.map(item => `
        <div style="display:grid;grid-template-columns:1fr auto auto;gap:.75rem;align-items:center;padding:.75rem 0;border-bottom:1px solid var(--border);">
            <div>
                <div style="font-weight:800;">${escapeHtml(item.product_name || item.name || 'Product')}</div>
                ${item.product_variant_name ? `<div style="font-size:.8rem;color:var(--text-muted);">Variant: ${escapeHtml(item.product_variant_name)}</div>` : ''}
                ${item.sku ? `<div style="font-size:.75rem;color:var(--text-muted);">SKU: ${escapeHtml(item.sku)}</div>` : ''}
            </div>
            <div style="color:var(--text-muted);">× ${Number(item.quantity || 0)}</div>
            <strong>${adminOrderMoney(item.subtotal ?? ((Number(item.unit_price || item.price || 0)) * Number(item.quantity || 0)), currency)}</strong>
        </div>
    `).join('') : '<div style="padding:1rem 0;color:var(--text-muted);">No items recorded.</div>';

    const actionButtons = transitions.length ? transitions.map(nextStatus => {
        const isCancel = nextStatus === 'cancelled';
        const buttonClass = isCancel ? 'danger' : 'success';
        return `
            <button class="admin-action-btn ${buttonClass}" style="padding:.7rem 1rem;min-width:120px;" onclick="openAdminOrderStatusConfirmation('${String(order.id)}','${nextStatus}')">
                ${isCancel ? '✕' : nextStatus === 'confirmed' ? '✅' : nextStatus === 'processing' ? '⚙️' : nextStatus === 'shipped' ? '🚚' : nextStatus === 'delivered' ? '📦' : '↩️'}
                ${adminOrderStatusLabel(nextStatus)}
            </button>
        `;
    }).join('') : '<div style="color:var(--text-muted);padding:.5rem 0;">No status changes are available from this state.</div>';

    return `
        <div style="display:grid;gap:1rem;">
            <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding:1rem;border:1px solid var(--border);border-radius:14px;background:var(--bg-alt);">
                <div>
                    <div style="font-size:.8rem;color:var(--text-muted);text-transform:uppercase;">Order</div>
                    <div style="font-size:1.35rem;font-weight:900;color:var(--primary);">#${escapeHtml(String(adminOrderDisplayId(order)))}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:.8rem;color:var(--text-muted);">Status</div>
                    <div style="font-weight:900;">${escapeHtml(adminOrderStatusLabel(status))}</div>
                    <div style="font-size:.78rem;color:var(--text-muted);">Payment: ${escapeHtml(String(order.payment_status || order.paymentStatus || 'pending'))}</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
                <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;">
                    <h4 style="margin:0 0 .75rem;">👤 Customer</h4>
                    <div style="display:grid;gap:.35rem;font-size:.92rem;">
                        <div><strong>Name:</strong> ${escapeHtml(customerName)}</div>
                        <div><strong>Phone:</strong> ${escapeHtml(customerPhone)}</div>
                        <div><strong>Email:</strong> ${escapeHtml(customerEmail)}</div>
                        <div><strong>City:</strong> ${escapeHtml(customerCity)}</div>
                        <div><strong>Address:</strong> ${escapeHtml(customerAddress)}</div>
                    </div>
                </div>

                <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;">
                    <h4 style="margin:0 0 .75rem;">💳 Payment</h4>
                    <div style="display:grid;gap:.45rem;font-size:.92rem;">
                        <div><strong>Method:</strong> ${escapeHtml(String(order.payment || 'COD'))}</div>
                        <div><strong>Payment status:</strong> ${escapeHtml(String(order.payment_status || order.paymentStatus || 'pending'))}</div>
                        <div><strong>Total:</strong> ${adminOrderMoney(total, currency)}</div>
                    </div>
                </div>
            </div>

            <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;">
                <h4 style="margin:0 0 .75rem;">🧾 Items (${items.length})</h4>
                ${itemRows}
            </div>

            ${order.customer_notes || customer.notes ? `
                <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;">
                    <h4 style="margin:0 0 .5rem;">📝 Customer Notes</h4>
                    <div style="white-space:pre-wrap;color:var(--text-muted);">${escapeHtml(order.customer_notes || customer.notes)}</div>
                </div>
            ` : ''}

            <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;">
                <h4 style="margin:0 0 .75rem;">🔄 Available Status Changes</h4>
                <div style="display:flex;gap:.6rem;flex-wrap:wrap;">
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;
}

async function openAdminOrderDetails(orderRef) {
    ensureAdminOrderLifecycleModals();

    const modal = document.getElementById('adminOrderDetailsModal');
    const content = document.getElementById('adminOrderDetailsContent');
    if (!modal || !content) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    content.innerHTML = '<div class="admin-empty" style="padding:2rem;"><div class="empty-icon">⏳</div><h4>Loading order details…</h4></div>';

    const order = await loadAdminOrderDetails(orderRef);
    if (!order) {
        showToast('❌ ORDER_NOT_FOUND', 'error');
        closeModal('adminOrderDetailsModal');
        return;
    }

    window.__VELORA_ADMIN_ORDER_CONTEXT = { order, orderRef, dbId: order.id };
    const title = document.getElementById('adminOrderDetailsTitle');
    if (title) title.textContent = `🛒 Order #${adminOrderDisplayId(order)}`;
    content.innerHTML = renderAdminOrderDetailsContent(order);
}

function openAdminOrderStatusConfirmation(orderRef, newStatus) {
    ensureAdminOrderLifecycleModals();

    const context = window.__VELORA_ADMIN_ORDER_CONTEXT;
    const order = context?.order;
    if (!order || String(context.dbId) !== String(orderRef)) {
        showToast('Please reopen the order details and try again.', 'warning');
        return;
    }

    const currentStatus = normalizeAdminOrderStatus(order.status);
    const targetStatus = normalizeAdminOrderStatus(newStatus);

    if (!(ADMIN_ORDER_TRANSITIONS[currentStatus] || []).includes(targetStatus)) {
        showToast('❌ INVALID_TRANSITION', 'error');
        return;
    }

    const modal = document.getElementById('adminOrderConfirmModal');
    const content = document.getElementById('adminOrderConfirmContent');
    if (!modal || !content) return;

    content.innerHTML = `
        <div style="display:grid;gap:1rem;">
            <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;background:var(--bg-alt);">
                <div style="font-weight:800;margin-bottom:.35rem;">Change order status?</div>
                <div style="font-size:1rem;">
                    From <strong>${escapeHtml(adminOrderStatusLabel(currentStatus))}</strong>
                    to <strong style="color:var(--primary);">${escapeHtml(adminOrderStatusLabel(targetStatus))}</strong>
                </div>
            </div>

            <div>
                <label for="adminOrderStatusNote" style="display:block;font-weight:700;margin-bottom:.45rem;">Note (optional)</label>
                <textarea id="adminOrderStatusNote" class="form-input" maxlength="500" rows="4" placeholder="Optional note (max 500 characters)"></textarea>
                <div style="font-size:.75rem;color:var(--text-muted);margin-top:.25rem;">Maximum 500 characters.</div>
            </div>

            <div style="display:flex;gap:.6rem;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="closeModal('adminOrderConfirmModal')">Cancel</button>
                <button class="btn btn-primary" onclick="executeAdminOrderStatusChange('${String(order.id)}','${targetStatus}')">Confirm</button>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('adminOrderStatusNote')?.focus(), 50);
}

async function executeAdminOrderStatusChange(orderUuid, newStatus) {
    const client = window.mahaSupabase;
    if (!client?.rpc) {
        showToast('❌ Order status service unavailable', 'error');
        return;
    }

    const context = window.__VELORA_ADMIN_ORDER_CONTEXT;
    const note = document.getElementById('adminOrderStatusNote')?.value?.trim() || null;

    if (!isAdminOrderUuid(orderUuid)) {
        showToast('❌ ORDER_NOT_FOUND', 'error');
        return;
    }

    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData?.session) {
        closeModal('adminOrderConfirmModal');
        closeModal('adminOrderDetailsModal');
        showToast('Please login to continue.', 'warning');
        if (typeof openAuthModal === 'function') setTimeout(() => openAuthModal('login'), 150);
        return;
    }

    const confirmButton = document.querySelector('#adminOrderConfirmModal .btn-primary');
    if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.textContent = 'Saving…';
    }

    const { data, error } = await client.rpc('velora_admin_update_order_status', {
        p_order_id: orderUuid,
        p_new_status: normalizeAdminOrderStatus(newStatus),
        p_note: note
    });

    if (error) {
        const code = adminOrderRpcCode(error);
        closeModal('adminOrderConfirmModal');

        if (code === 'AUTH_REQUIRED') {
            closeModal('adminOrderDetailsModal');
            showToast('Please login to continue.', 'warning');
            if (typeof openAuthModal === 'function') setTimeout(() => openAuthModal('login'), 150);
            return;
        }
        if (code === 'INVALID_TRANSITION') {
            showToast('❌ INVALID_TRANSITION', 'error');
            return;
        }
        if (code === 'FORBIDDEN') {
            showToast('❌ FORBIDDEN', 'error');
            return;
        }
        if (code === 'ORDER_NOT_FOUND') {
            showToast('❌ ORDER_NOT_FOUND', 'error');
            closeModal('adminOrderDetailsModal');
            return;
        }
        if (code === 'NOTE_TOO_LONG') {
            showToast('❌ NOTE_TOO_LONG', 'error');
            return;
        }
        showToast('❌ Could not update order status.', 'error');
        console.error('Velora admin order status RPC:', error);
        return;
    }

    const result = data || {};
    const newState = normalizeAdminOrderStatus(result.new_status || newStatus);

    const orders = getOrders();
    let cacheChanged = false;
    const contextOrder = context?.order;
    const canonicalId = String(orderUuid);

    orders.forEach(order => {
        const sameOrder =
            String(order.id) === canonicalId ||
            String(order.order_id || '') === canonicalId ||
            String(order.order_number ?? order.orderNumber ?? '') === String(contextOrder?.order_number ?? contextOrder?.orderNumber ?? '');
        if (sameOrder) {
            order.status = newState;
            order.order_id = order.order_id || order.id;
            order.canonical_order_id = canonicalId;
            cacheChanged = true;
        }
    });

    if (cacheChanged) saveToStorage('maha_orders', orders);
    if (context?.order) context.order.status = newState;

    closeModal('adminOrderConfirmModal');
    showToast(`✅ Order #${adminOrderDisplayId(context?.order || {})} → ${adminOrderStatusLabel(newState)}`, 'success');

    if (typeof showAdminSection === 'function') showAdminSection('orders');
    setTimeout(() => openAdminOrderDetails(orderUuid), 60);
}

/* ============ RENDER: ORDERS ============ */
function renderAdminOrders() {
    const orders = getOrders();

    return `
        <div class="admin-section-card">
            <h3>🛒 All Orders (${orders.length})</h3>
            ${orders.length === 0 ? `
                <div class="admin-empty">
                    <div class="empty-icon">📭</div>
                    <h4>No orders yet</h4>
                </div>
            ` : `
                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(o => {
                                const status = normalizeAdminOrderStatus(o.status);
                                return `
                                    <tr
                                        data-order-id="${escapeHtml(String(o.id))}"
                                        role="button"
                                        tabindex="0"
                                        style="cursor:pointer;"
                                        onclick="openAdminOrderDetails('${String(o.id)}')"
                                        onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); openAdminOrderDetails('${String(o.id)}'); }"
                                    >
                                        <td><strong style="color: var(--primary); font-family: monospace;">#${escapeHtml(String(adminOrderDisplayId(o)))}</strong></td>
                                        <td>${escapeHtml(o.customer?.name || o.customer_name || 'N/A')}</td>
                                        <td>${escapeHtml(o.customer?.phone || o.customer_phone || 'N/A')}</td>
                                        <td>${escapeHtml(o.customer?.city || o.customer_city || 'N/A')}</td>
                                        <td>${o.items?.length || 0}</td>
                                        <td><strong>${formatPrice(o.total)}</strong></td>
                                        <td>${escapeHtml(String(o.payment || o.paymentMethod || 'COD'))}</td>
                                        <td>
                                            <span class="admin-badge" style="background: rgba(33,150,243,.12); color: var(--primary);">
                                                ${escapeHtml(adminOrderStatusLabel(status))}
                                            </span>
                                        </td>
                                        <td>${o.date ? new Date(o.date).toLocaleDateString('en-US') : (o.created_at ? new Date(o.created_at).toLocaleDateString('en-US') : 'N/A')}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

/* ============ RENDER: USERS ============ */
function renderAdminUsers() {
    const users = getAllUsersV2();

    return `
        <div class="admin-section-card">
            <h3>👥 All Users (${users.length})</h3>
            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => {
                            const roleInfo = ROLE_INFO[u.role] || ROLE_INFO[ROLES.CUSTOMER];
                            return `
                                <tr>
                                    <td><strong>${escapeHtml(u.name)}</strong></td>
                                    <td>${escapeHtml(u.email)}</td>
                                    <td>${escapeHtml(u.phone || 'N/A')}</td>
                                    <td>
                                        <span class="admin-badge" style="background: ${roleInfo.color}20; color: ${roleInfo.color};">
                                            ${roleInfo.icon} ${roleInfo.label}
                                        </span>
                                    </td>
                                    <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US') : 'N/A'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/* ============ RENDER: COUPONS ============ */
function renderAdminCoupons() {
    return `
        <div class="admin-section-card">
            <h3>🎟️ Active Coupons</h3>
            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Min Purchase</th>
                            <th>Description</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(COUPONS).map(c => `
                            <tr>
                                <td><strong style="font-family: monospace; color: var(--primary);">${c.code}</strong></td>
                                <td>${c.type}</td>
                                <td>${c.type === 'percent' ? c.value + '%' : c.type === 'fixed' ? 'EGP ' + c.value : 'Free Shipping'}</td>
                                <td>${formatPrice(c.minPurchase)}</td>
                                <td>${escapeHtml(c.description)}</td>
                                <td>
                                    <span class="admin-badge ${c.active ? 'admin-badge-success' : 'admin-badge-error'}" 
                                        style="background: ${c.active ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)'}; color: ${c.active ? '#4caf50' : '#f44336'};">
                                        ${c.active ? '✅ Active' : '❌ Inactive'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/* ============ RENDER: SETTINGS ============ */
function renderAdminSettings() {
    const settings = getFromStorage('maha_settings', {
        whatsapp: '+20 100 123 4567',
        email: 'support@maha-beauty.com',
        address: 'Cairo, Egypt'
    });

    return `
        <div class="admin-section-card">
            <h3>📞 Contact Settings</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 600px;">
                <div class="form-group">
                    <label>WhatsApp Number</label>
                    <input type="text" class="form-input" id="settingWhatsapp" value="${escapeHtml(settings.whatsapp)}">
                </div>
                <div class="form-group">
                    <label>Support Email</label>
                    <input type="email" class="form-input" id="settingEmail" value="${escapeHtml(settings.email)}">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" class="form-input" id="settingAddress" value="${escapeHtml(settings.address)}">
                </div>
                <button class="btn btn-primary" onclick="saveAdminSettings()">💾 Save Settings</button>
            </div>
        </div>
    `;
}

function saveAdminSettings() {
    const settings = {
        whatsapp: document.getElementById('settingWhatsapp')?.value || '',
        email: document.getElementById('settingEmail')?.value || '',
        address: document.getElementById('settingAddress')?.value || ''
    };
    saveToStorage('maha_settings', settings);
    showToast('✅ Settings saved!', 'success');
}

/* ============ UPDATE GLOBAL API ============ */
window.openAdminPlatform = openAdminPlatform;
window.openAdminPanel = openAdminPlatform;
window.closeAdminPlatform = closeAdminPlatform;
window.showAdminSection = showAdminSection;

/* ============ UPDATE PLATFORM SWITCHER ============ */
const originalSwitchPlatform = switchPlatform;
switchPlatform = function(platformId) {
    const menu = document.getElementById('platformSwitcherMenu');
    if (menu) menu.classList.remove('open');

    switch (platformId) {
        case 'marketplace':
            closeSellerPlatform();
            closeAdminPlatform();
            showToast('🛒 Marketplace', 'info');
            break;
        case 'seller':
            openSellerPlatform();
            break;
        case 'admin':
            openAdminPlatform();
            break;
        case 'owner':
            showToast('👑 Owner Center (coming soon)', 'info');
            break;
    }
};

/* ============ INIT ============ */
console.log('✅ Admin Panel loaded!');
console.log('💡 Type in console: openAdminPlatform()');

/* ============================================
   VELORA - Multi-Vendor Cart + Commission
   ============================================ */

console.log('🛒 Loading multi-vendor cart...');

/* ============ COMMISSION CONFIG ============ */
const COMMISSION_CONFIG = {
    default: 15, // 15% افتراضي
    byCategory: {
        'skincare': 15,
        'makeup': 12,
        'hair': 15,
        'nails': 18,
        'perfumes': 10,
        'bodycare': 15
    },
    byPlan: {
        'free': 20,
        'basic': 15,
        'pro': 12,
        'enterprise': 10
    },
    bySeller: {} // حسب البائع (يتعدل من الأدمن)
};

/* ============ CALCULATE COMMISSION FOR ITEM ============ */
function calculateCommission(product, quantity = 1) {
    const total = product.price * quantity;
    
    // لو المنتج من بائع
    if (product.sellerId) {
        const seller = getSellerById(product.sellerId);
        if (seller) {
            // عمولة حسب خطة البائع
            const plan = seller.plan || 'free';
            const rate = COMMISSION_CONFIG.byPlan[plan] || COMMISSION_CONFIG.default;
            const commission = (total * rate) / 100;
            return {
                rate: rate,
                commission: Math.round(commission),
                sellerEarning: Math.round(total - commission)
            };
        }
    }
    
    // لو منتج المنصة نفسه
    return {
        rate: 0,
        commission: 0,
        sellerEarning: total
    };
}

/* ============ GET PRODUCT WITH SELLER INFO ============ */
function getProductWithSeller(productId) {
    // ابحث في منتجات المنصة
    let product = MAHA_DATA.PRODUCTS.find(p => p.id === productId);
    
    // لو مش موجود، ابحث في منتجات البائعين
    if (!product) {
        const allSellerProducts = getFromStorage('maha_seller_products', {});
        for (const sellerId of Object.keys(allSellerProducts)) {
            const found = allSellerProducts[sellerId].find(p => p.id === productId);
            if (found) {
                product = { ...found, sellerId: sellerId };
                break;
            }
        }
    }
    
    return product;
}

/* ============ GROUP CART BY SELLER ============ */
function groupCartBySeller() {
    const groups = {};
    
    STATE.cart.forEach(item => {
        const product = getProductWithSeller(item.id);
        const sellerId = product?.sellerId || 'maha'; // منتجات المنصة
        const seller = sellerId !== 'maha' ? getSellerById(sellerId) : null;
        
        if (!groups[sellerId]) {
            groups[sellerId] = {
                sellerId: sellerId,
                sellerName: seller ? seller.storeName : 'Velora',
                sellerLogo: seller ? '🏪' : '✨',
                items: []
            };
        }
        
        groups[sellerId].items.push({
            ...item,
            product: product,
            commission: calculateCommission(product, item.quantity)
        });
    });
    
    return groups;
}

/* ============ OVERRIDE renderCartSidebar (Multi-Vendor) ============ */
const originalRenderCartSidebarMV = renderCartSidebar;
renderCartSidebar = function() {
    const body = document.getElementById('cartSidebarBody');
    const footer = document.getElementById('cartSidebarFooter');
    if (!body || !footer) return;

    if (STATE.cart.length === 0) {
        body.innerHTML = `
            <div class="cart-empty">
                <div class="empty-icon">🛒</div>
                <h4>Your cart is empty</h4>
                <p>Start shopping to add products</p>
                <button class="btn btn-primary" onclick="closeCart(); navigateTo('shop');">Shop Now</button>
            </div>
        `;
        footer.innerHTML = '';
        return;
    }

    // Group by seller
    const groups = groupCartBySeller();
    const sellerCount = Object.keys(groups).length;

    body.innerHTML = Object.values(groups).map(group => `
        <div class="cart-vendor-group">
            <div class="cart-vendor-header">
                <span>${group.sellerLogo} ${escapeHtml(group.sellerName)}</span>
                <span>${group.items.length} item${group.items.length > 1 ? 's' : ''}</span>
            </div>
            <div class="cart-vendor-body">
                ${group.items.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-image">${item.emoji}</div>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${escapeHtml(item.name)}</div>
                            <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                        </div>
                        <div class="cart-item-controls">
                            <div class="qty-control">
                                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                            </div>
                            <button class="cart-remove" onclick="removeFromCart('${item.id}')">✕</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    const subtotal = getCartTotal();
    const discount = calculateDiscount();
    const shipping = (subtotal - discount) >= 500 ? 0 : 30;
    const total = Math.max(0, subtotal - discount) + shipping;

    let couponHtml = '';
    if (appliedCoupon) {
        couponHtml = `
            <div class="coupon-applied">
                <span>🎟️ ${appliedCoupon.code}</span>
                <button onclick="removeCoupon()">✕</button>
            </div>
        `;
    } else {
        couponHtml = `
            <div class="coupon-box">
                <input type="text" class="coupon-input" id="couponInput" placeholder="Coupon code" onkeypress="if(event.key==='Enter'){event.preventDefault();applyCoupon();}">
                <button class="coupon-btn" onclick="applyCoupon()">Apply</button>
            </div>
        `;
    }

    footer.innerHTML = `
        ${couponHtml}
        ${sellerCount > 1 ? `
            <div class="order-split-info">
                ℹ️ Your order contains items from <strong>${sellerCount} sellers</strong>. It will be split into separate orders automatically.
            </div>
        ` : ''}
        <div class="cart-summary-row">
            <span>Subtotal</span>
            <span>${formatPrice(subtotal)}</span>
        </div>
        ${discount > 0 ? `
            <div class="cart-summary-row" style="color: var(--success);">
                <span>Discount</span>
                <span>-${formatPrice(discount)}</span>
            </div>
        ` : ''}
        <div class="cart-summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? '🎉 Free' : formatPrice(shipping)}</span>
        </div>
        <div class="cart-summary-row total">
            <span>Total</span>
            <span>${formatPrice(total)}</span>
        </div>
        <div class="cart-actions">
            <button class="btn btn-primary btn-block" onclick="closeCart(); navigateTo('checkout');">
                💳 Checkout
            </button>
            <button class="btn btn-outline btn-block" onclick="closeCart(); navigateTo('cart');">
                View Cart
            </button>
        </div>
    `;
};

/* ============ OVERRIDE renderCartPage (Multi-Vendor) ============ */
const originalRenderCartPageMV = renderCartPage;
renderCartPage = function() {
    const container = document.getElementById('cartContent');
    if (!container) return;

    if (STATE.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Start shopping to add products</p>
                <button class="btn btn-primary btn-lg" onclick="navigateTo('shop')">Shop Now</button>
            </div>
        `;
        return;
    }

    const groups = groupCartBySeller();
    const sellerCount = Object.keys(groups).length;
    const subtotal = getCartTotal();
    const discount = calculateDiscount();
    const shipping = (subtotal - discount) >= 500 ? 0 : 30;
    const total = Math.max(0, subtotal - discount) + shipping;

    let couponHtml = '';
    if (appliedCoupon) {
        couponHtml = `
            <div class="coupon-applied">
                <span>🎟️ ${appliedCoupon.code}</span>
                <button onclick="removeCoupon()">✕</button>
            </div>
        `;
    } else {
        couponHtml = `
            <div class="coupon-box">
                <input type="text" class="coupon-input" id="couponInput" placeholder="Coupon code" onkeypress="if(event.key==='Enter'){event.preventDefault();applyCoupon();}">
                <button class="coupon-btn" onclick="applyCoupon()">Apply</button>
            </div>
        `;
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem; align-items: start;">
            <div>
                ${sellerCount > 1 ? `
                    <div class="order-split-info" style="margin-bottom: 1rem;">
                        ℹ️ <strong>Multi-Vendor Order:</strong> Your cart contains items from <strong>${sellerCount} sellers</strong>. 
                        Each seller's items will be processed separately.
                    </div>
                ` : ''}
                ${Object.values(groups).map(group => `
                    <div class="cart-vendor-group" style="margin-bottom: 1rem;">
                        <div class="cart-vendor-header">
                            <span>${group.sellerLogo} ${escapeHtml(group.sellerName)}</span>
                            <span>${group.items.length} item${group.items.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="cart-vendor-body">
                            ${group.items.map(item => `
                                <div class="cart-item" style="background: var(--bg);">
                                    <div class="cart-item-image">${item.emoji}</div>
                                    <div class="cart-item-info">
                                        <div class="cart-item-name">${escapeHtml(item.name)}</div>
                                        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                                    </div>
                                    <div class="cart-item-controls">
                                        <div class="qty-control">
                                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                                            <span class="qty-value">${item.quantity}</span>
                                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                                        </div>
                                        <button class="cart-remove" onclick="removeFromCart('${item.id}')">✕</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-summary">
                <h3>Summary</h3>
                ${couponHtml}
                <div class="order-total-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
                ${discount > 0 ? `<div class="order-total-row" style="color: var(--success); font-weight: 700;"><span>Discount</span><span>-${formatPrice(discount)}</span></div>` : ''}
                <div class="order-total-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                <div class="order-total-row grand"><span>Total</span><span>${formatPrice(total)}</span></div>
                <button class="btn btn-primary btn-block btn-lg" style="margin-top: 1.5rem;" onclick="navigateTo('checkout')">
                    💳 Checkout
                </button>
                <button class="btn btn-outline btn-block" style="margin-top: 0.5rem;" onclick="navigateTo('shop')">
                    Continue Shopping
                </button>
            </div>
        </div>
    `;
};

/* ============ OVERRIDE placeOrder (Multi-Vendor Split) ============ */
const originalPlaceOrderMV = placeOrder;
placeOrder = function(event) {
    event.preventDefault();

    if (STATE.cart.length === 0) {
        showToast('⚠️ Your cart is empty', 'warning');
        return;
    }

    const name = document.getElementById('custName')?.value.trim();
    const phone = document.getElementById('custPhone')?.value.trim();
    const email = document.getElementById('custEmail')?.value.trim();
    const city = document.getElementById('custCity')?.value.trim();
    const address = document.getElementById('custAddress')?.value.trim();
    const notes = document.getElementById('custNotes')?.value.trim();

    if (!name || !phone || !city || !address) {
        showToast('⚠️ Please fill all required fields', 'warning');
        return;
    }

    const subtotal = getCartTotal();
    const discount = calculateDiscount();
    const shipping = (subtotal - discount) >= 500 ? 0 : 30;
    const total = Math.max(0, subtotal - discount) + shipping;

    // Group items by seller
    const groups = groupCartBySeller();
    const sellerIds = Object.keys(groups);

    // Parent Order ID
    const parentOrderId = 'ORD-' + Date.now();

    // Create sub-orders for each seller
    const subOrders = [];
    const allOrders = getOrders();

    sellerIds.forEach((sellerId, idx) => {
        const group = groups[sellerId];

        // Calculate seller totals
        let sellerSubtotal = 0;
        let sellerCommission = 0;
        let sellerEarning = 0;

        group.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            sellerSubtotal += itemTotal;
            sellerCommission += item.commission.commission;
            sellerEarning += item.commission.sellerEarning;
        });

        // Proportional shipping
        const itemCount = group.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalItemCount = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
        const sellerShipping = totalItemCount > 0 ? Math.round((itemCount / totalItemCount) * shipping) : 0;
        const sellerDiscount = totalItemCount > 0 ? Math.round((itemCount / totalItemCount) * discount) : 0;
        const sellerTotal = sellerSubtotal - sellerDiscount + sellerShipping;

        const subOrder = {
            id: sellerIds.length > 1 ? `${parentOrderId}-S${idx + 1}` : parentOrderId,
            parentOrderId: sellerIds.length > 1 ? parentOrderId : null,
            date: Date.now(),
            sellerId: sellerId,
            sellerName: group.sellerName,
            items: group.items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                emoji: item.emoji,
                sellerId: sellerId
            })),
            customer: { name, phone, email, city, address, notes },
            payment: selectedPayment,
            subtotal: sellerSubtotal,
            discount: sellerDiscount,
            shipping: sellerShipping,
            commission: sellerCommission,
            sellerEarning: sellerEarning,
            total: sellerTotal,
            status: 'Pending'
        };

        subOrders.push(subOrder);
        allOrders.unshift(subOrder);
    });

    // Save all orders
    saveToStorage('maha_orders', allOrders);

    // Update seller stats
    sellerIds.forEach(sellerId => {
        if (sellerId === 'maha') return; // Skip platform products
        const seller = getSellerById(sellerId);
        if (seller) {
            const group = groups[sellerId];
            const sellerSubtotal = group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            seller.totalOrders = (seller.totalOrders || 0) + 1;
            seller.totalSales = (seller.totalSales || 0) + sellerSubtotal;
            saveSeller(seller);
        }
    });

    // Clear cart
    STATE.cart = [];
    saveToStorage(KEYS.CART, STATE.cart);
    updateCartBadge();

    // Show success
    showOrderSuccessModal(parentOrderId, subOrders, total);
};

/* ============ ORDER SUCCESS MODAL ============ */
function showOrderSuccessModal(parentOrderId, subOrders, total) {
    let modal = document.getElementById('orderSuccessModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'orderSuccessModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    const isMultiVendor = subOrders.length > 1;

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 550px; text-align: center;">
            <div style="font-size: 5rem; margin-bottom: 1rem;">🎉</div>
            <h2 style="color: var(--primary); margin-bottom: 0.5rem;">Order Placed Successfully!</h2>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
                Thank you for your order. We'll contact you shortly to confirm.
            </p>

            <div style="background: var(--bg-alt); padding: 1.25rem; border-radius: 12px; text-align: left; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                    <span style="color: var(--text-muted);">Order ID:</span>
                    <strong style="color: var(--primary); font-family: monospace;">${parentOrderId}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                    <span style="color: var(--text-muted);">Total:</span>
                    <strong>${formatPrice(total)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Payment:</span>
                    <strong>${selectedPayment === 'cod' ? 'Cash on Delivery' : selectedPayment === 'vodafone' ? 'Vodafone Cash' : 'InstaPay'}</strong>
                </div>
            </div>

            ${isMultiVendor ? `
                <div class="order-split-info" style="text-align: left; margin-bottom: 1.5rem;">
                    <strong>📦 Multi-Vendor Order</strong><br>
                    Your order has been split into <strong>${subOrders.length} sub-orders</strong>:
                    <ul style="margin-top: 0.5rem; padding-left: 1.2rem; font-size: 0.85rem;">
                        ${subOrders.map(so => `
                            <li>
                                <strong>${escapeHtml(so.sellerName)}</strong> — ${so.items.length} item${so.items.length > 1 ? 's' : ''} — ${formatPrice(so.total)}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <div style="display: flex; gap: 0.75rem;">
                <button class="btn btn-primary" style="flex: 1;" onclick="closeModal('orderSuccessModal'); navigateTo('orders');">
                    📦 View Orders
                </button>
                <button class="btn btn-outline" style="flex: 1;" onclick="closeModal('orderSuccessModal'); navigateTo('shop');">
                    Continue Shopping
                </button>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/* ============ SELLER ORDERS UPDATE (Multi-Vendor) ============ */
// Update seller orders to filter by sellerId property
getSellerOrders = function(sellerId) {
    const allOrders = getOrders();
    
    return allOrders.filter(order => {
        // New format: sub-order with sellerId
        if (order.sellerId) {
            return order.sellerId === sellerId;
        }
        // Legacy format: check items
        return order.items?.some(item => item.sellerId === sellerId);
    }).map(order => {
        if (order.sellerId) {
            // Already a sub-order
            return {
                id: order.id,
                parentOrderId: order.parentOrderId,
                customerName: order.customer?.name || 'Customer',
                items: order.items,
                total: order.subtotal || order.total,
                commission: order.commission || 0,
                sellerEarning: order.sellerEarning || 0,
                status: order.status || 'Pending',
                date: order.date
            };
        }
        // Legacy format
        const sellerItems = order.items.filter(i => i.sellerId === sellerId);
        const sellerTotal = sellerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const commission = sellerTotal * 0.15;
        const sellerEarning = sellerTotal - commission;
        return {
            id: order.id,
            customerName: order.customer?.name || 'Customer',
            items: sellerItems,
            total: sellerTotal,
            commission: commission,
            sellerEarning: sellerEarning,
            status: order.status || 'Pending',
            date: order.date
        };
    });
};

/* ============ UPDATE renderSellerOrders ============ */
renderSellerOrders = function(seller) {
    const orders = getSellerOrders(seller.id);
    const totalEarned = orders.reduce((sum, o) => sum + (o.sellerEarning || 0), 0);

    return `
        <div class="seller-kpi-grid">
            <div class="seller-kpi-card" style="border-color: #2196f3;">
                <div class="seller-kpi-icon">📦</div>
                <div class="seller-kpi-value" style="color: #2196f3;">${orders.length}</div>
                <div class="seller-kpi-label">Total Orders</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #4caf50;">
                <div class="seller-kpi-icon">💰</div>
                <div class="seller-kpi-value" style="color: #4caf50; font-size: 1.1rem;">${formatPrice(totalEarned)}</div>
                <div class="seller-kpi-label">Total Earned</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #ff9800;">
                <div class="seller-kpi-icon">⏳</div>
                <div class="seller-kpi-value" style="color: #ff9800;">${orders.filter(o => o.status === 'Pending').length}</div>
                <div class="seller-kpi-label">Pending</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #4caf50;">
                <div class="seller-kpi-icon">✅</div>
                <div class="seller-kpi-value" style="color: #4caf50;">${orders.filter(o => o.status === 'Delivered').length}</div>
                <div class="seller-kpi-label">Delivered</div>
            </div>
        </div>

        <div class="seller-section-card">
            <h3>📦 Your Orders (${orders.length})</h3>
            ${orders.length === 0 ? `
                <div class="seller-empty">
                    <div class="empty-icon">📭</div>
                    <h4>No orders yet</h4>
                    <p>When customers buy your products, orders will appear here</p>
                </div>
            ` : `
                <div class="seller-table-wrap">
                    <table class="seller-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Commission</th>
                                <th>Your Earnings</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(o => `
                                <tr>
                                    <td>
                                        <strong style="color: var(--primary); font-family: monospace;">${o.id}</strong>
                                        ${o.parentOrderId ? `<br><span style="font-size: 0.7rem; color: var(--text-muted);">Parent: ${o.parentOrderId}</span>` : ''}
                                    </td>
                                    <td>${escapeHtml(o.customerName || 'N/A')}</td>
                                    <td>${o.items?.length || 0}</td>
                                    <td>${formatPrice(o.total || 0)}</td>
                                    <td style="color: var(--error);">-${formatPrice(o.commission || 0)}</td>
                                    <td><strong style="color: var(--success);">${formatPrice(o.sellerEarning || 0)}</strong></td>
                                    <td>
                                        <span class="admin-badge admin-badge-warning">${o.status || 'Pending'}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
};

/* ============ OVERRIDE renderSellerEarnings ============ */
renderSellerEarnings = function(seller) {
    const orders = getSellerOrders(seller.id);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalCommission = orders.reduce((sum, o) => sum + (o.commission || 0), 0);
    const totalEarnings = orders.reduce((sum, o) => sum + (o.sellerEarning || 0), 0);
    const plan = SELLER_PLANS[seller.plan] || SELLER_PLANS.free;

    return `
        <div class="seller-kpi-grid">
            <div class="seller-kpi-card" style="border-color: #2196f3;">
                <div class="seller-kpi-icon">💵</div>
                <div class="seller-kpi-value" style="color: #2196f3; font-size: 1.1rem;">${formatPrice(totalRevenue, 'EGP')}</div>
                <div class="seller-kpi-label">Gross Sales</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #f44336;">
                <div class="seller-kpi-icon">💎</div>
                <div class="seller-kpi-value" style="color: #f44336; font-size: 1.1rem;">-${formatPrice(totalCommission, 'EGP')}</div>
                <div class="seller-kpi-label">Platform Commission</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #4caf50;">
                <div class="seller-kpi-icon">💰</div>
                <div class="seller-kpi-value" style="color: #4caf50; font-size: 1.1rem;">${formatPrice(totalEarnings, 'EGP')}</div>
                <div class="seller-kpi-label">Net Earnings</div>
            </div>
            <div class="seller-kpi-card" style="border-color: #9c27b0;">
                <div class="seller-kpi-icon">📊</div>
                <div class="seller-kpi-value" style="color: #9c27b0;">${plan.commission}%</div>
                <div class="seller-kpi-label">Your Commission Rate</div>
            </div>
        </div>

        <div class="seller-section-card">
            <h3>💰 Earnings Breakdown</h3>
            <div style="padding: 1rem 0;">
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-muted);">Total Sales</span>
                    <strong>${formatPrice(totalRevenue, 'EGP')}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <span style="color: var(--text-muted);">Platform Fee (${plan.commission}%)</span>
                    <strong style="color: var(--error);">-${formatPrice(totalCommission, 'EGP')}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0;">
                    <span style="color: var(--text-muted);">Available Balance</span>
                    <strong style="color: var(--success); font-size: 1.15rem;">${formatPrice(totalEarnings, 'EGP')}</strong>
                </div>
            </div>
        </div>
    `;
};

/* ============ INIT ============ */
console.log('✅ Multi-Vendor Cart loaded!');
console.log('📊 Commission Config:', COMMISSION_CONFIG);

/* ============================================
   VELORA - Owner Command Center
   ============================================ */

console.log('👑 Loading Owner Command Center...');

/* ============ OWNER STATE ============ */
const OWNER_STATE = {
    currentSection: 'dashboard'
};

/* ============ DATA AGGREGATION ============ */
function getOwnerStats() {
    const users = getAllUsersV2();
    const sellers = getAllSellers();
    const orders = getOrders();
    const sellerProducts = getFromStorage('maha_seller_products', {});

    // Count products
    let totalProducts = MAHA_DATA.PRODUCTS.length;
    Object.values(sellerProducts).forEach(arr => {
        if (Array.isArray(arr)) totalProducts += arr.length;
    });

    // Revenue
    let totalRevenue = 0;
    let totalCommission = 0;
    orders.forEach(o => {
        totalRevenue += o.total || 0;
        if (o.commission) totalCommission += o.commission;
    });

    // Sellers stats
    const approvedSellers = sellers.filter(s => s.status === SELLER_STATUS.APPROVED).length;
    const pendingSellers = sellers.filter(s => s.status === SELLER_STATUS.PENDING).length;
    const suspendedSellers = sellers.filter(s => s.status === SELLER_STATUS.SUSPENDED).length;

    // Customers
    const customers = users.filter(u => u.role === ROLES.CUSTOMER);

    return {
        totalUsers: users.length,
        totalCustomers: customers.length,
        totalSellers: sellers.length,
        approvedSellers,
        pendingSellers,
        suspendedSellers,
        totalProducts,
        totalOrders: orders.length,
        totalRevenue,
        totalCommission,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        totalAdmins: users.filter(u => u.role === ROLES.ADMIN || u.role === ROLES.OWNER).length
    };
}

/* ============ OPEN OWNER PLATFORM ============ */
function openOwnerPlatform() {
    if (!STATE.user) {
        showToast('⚠️ Please login first', 'warning');
        return;
    }

    if (STATE.user.role !== ROLES.OWNER) {
        showToast('🔒 Owner access only', 'error');
        return;
    }

    let platform = document.getElementById('ownerPlatform');
    if (!platform) {
        platform = document.createElement('div');
        platform.id = 'ownerPlatform';
        platform.className = 'owner-platform';
        document.body.appendChild(platform);
    }

    platform.innerHTML = renderOwnerLayout();
    platform.classList.add('active');
    document.body.style.overflow = 'hidden';

    showOwnerSection('dashboard');
}

/* ============ RENDER OWNER LAYOUT ============ */
function renderOwnerLayout() {
    const stats = getOwnerStats();

    return `
        <aside class="owner-sidebar" id="ownerSidebar">
            <div class="owner-sidebar-header">
                <div class="owner-logo">👑</div>
                <div class="owner-store-info">
                    <div class="owner-store-name">Velora</div>
                    <div class="owner-store-sub">Command Center</div>
                </div>
            </div>

            <nav class="owner-nav">
                <div class="owner-nav-section">
                    <div class="owner-nav-title">📊 Analytics</div>
                    <div class="owner-nav-item active" data-section="dashboard" onclick="showOwnerSection('dashboard', this)">
                        <span>📊</span><span>Executive Dashboard</span>
                    </div>
                    <div class="owner-nav-item" data-section="live" onclick="showOwnerSection('live', this)">
                        <span>⚡</span><span>Live Activity</span>
                    </div>
                    <div class="owner-nav-item" data-section="revenue" onclick="showOwnerSection('revenue', this)">
                        <span>💰</span><span>Revenue Analytics</span>
                    </div>
                    <div class="owner-nav-item" data-section="customers" onclick="showOwnerSection('customers', this)">
                        <span>👥</span><span>Customer Analytics</span>
                    </div>
                </div>

                <div class="owner-nav-section">
                    <div class="owner-nav-title">🏪 Business</div>
                    <div class="owner-nav-item" data-section="sellers" onclick="showOwnerSection('sellers', this)">
                        <span>🏪</span><span>Seller Analytics</span>
                    </div>
                    <div class="owner-nav-item" data-section="products" onclick="showOwnerSection('products', this)">
                        <span>📦</span><span>Product Analytics</span>
                    </div>
                    <div class="owner-nav-item" data-section="orders" onclick="showOwnerSection('orders', this)">
                        <span>🛒</span><span>Order Analytics</span>
                    </div>
                </div>

                <div class="owner-nav-section">
                    <div class="owner-nav-title">🔍 Intelligence</div>
                    <div class="owner-nav-item" data-section="search" onclick="showOwnerSection('search', this)">
                        <span>🔍</span><span>Search Intelligence</span>
                    </div>
                    <div class="owner-nav-item" data-section="funnel" onclick="showOwnerSection('funnel', this)">
                        <span>🎯</span><span>Conversion Funnel</span>
                    </div>
                    <div class="owner-nav-item" data-section="bi" onclick="showOwnerSection('bi', this)">
                        <span>🧠</span><span>Business Intelligence</span>
                    </div>
                </div>

                <div class="owner-nav-section">
                    <div class="owner-nav-title">🛡️ Security</div>
                    <div class="owner-nav-item" data-section="risk" onclick="showOwnerSection('risk', this)">
                        <span>⚠️</span><span>Risk Center</span>
                    </div>
                    <div class="owner-nav-item" data-section="security" onclick="showOwnerSection('security', this)">
                        <span>🔐</span><span>Security Center</span>
                    </div>
                </div>

                <div class="owner-nav-section">
                    <div class="owner-nav-title">⚙️ System</div>
                    <div class="owner-nav-item" data-section="admins" onclick="showOwnerSection('admins', this)">
                        <span>👨‍💼</span><span>Admin Management</span>
                    </div>
                    <div class="owner-nav-item" data-section="settings" onclick="showOwnerSection('settings', this)">
                        <span>⚙️</span><span>Platform Settings</span>
                    </div>
                </div>
            </nav>

            <button class="owner-back-btn" onclick="closeOwnerPlatform()">
                <span>⬅️</span><span>Back to Store</span>
            </button>
        </aside>

        <main class="owner-main">
            <header class="owner-header">
                <button class="menu-btn" onclick="toggleOwnerSidebar()" style="display:none;">☰</button>
                <div class="owner-header-title" id="ownerHeaderTitle">Executive Dashboard</div>
                <div class="owner-header-actions">
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.85rem; background: rgba(76,175,80,0.1); border: 1px solid rgba(76,175,80,0.3); border-radius: 999px; font-size: 0.8rem; color: #4caf50; font-weight: 600;">
                        <span class="live-dot"></span>
                        <span>${stats.totalUsers} users</span>
                    </div>
                    <button class="owner-icon-btn" onclick="closeOwnerPlatform()">🚪</button>
                </div>
            </header>

            <div class="owner-content" id="ownerContent"></div>
        </main>
    `;
}

/* ============ CLOSE OWNER PANEL ============ */
function closeOwnerPlatform() {
    const platform = document.getElementById('ownerPlatform');
    if (platform) platform.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleOwnerSidebar() {
    const sidebar = document.getElementById('ownerSidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

/* ============ SHOW OWNER SECTION ============ */
function showOwnerSection(section, btn) {
    OWNER_STATE.currentSection = section;

    document.querySelectorAll('.owner-nav-item').forEach(item => item.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const titles = {
        dashboard: 'Executive Dashboard',
        live: 'Live Activity',
        revenue: 'Revenue Analytics',
        customers: 'Customer Analytics',
        sellers: 'Seller Analytics',
        products: 'Product Analytics',
        orders: 'Order Analytics',
        search: 'Search Intelligence',
        funnel: 'Conversion Funnel',
        bi: 'Business Intelligence',
        risk: 'Risk Center',
        security: 'Security Center',
        admins: 'Admin Management',
        settings: 'Platform Settings'
    };

    const titleEl = document.getElementById('ownerHeaderTitle');
    if (titleEl) titleEl.textContent = titles[section] || section;

    const content = document.getElementById('ownerContent');
    if (!content) return;

    switch(section) {
        case 'dashboard': content.innerHTML = renderOwnerDashboard(); break;
        case 'live': content.innerHTML = renderOwnerLive(); break;
        case 'revenue': content.innerHTML = renderOwnerRevenue(); break;
        case 'customers': content.innerHTML = renderOwnerCustomers(); break;
        case 'sellers': content.innerHTML = renderOwnerSellers(); break;
        case 'products': content.innerHTML = renderOwnerProducts(); break;
        case 'orders': content.innerHTML = renderOwnerOrders(); break;
        case 'search': content.innerHTML = renderOwnerSearch(); break;
        case 'funnel': content.innerHTML = renderOwnerFunnel(); break;
        case 'bi': content.innerHTML = renderOwnerBI(); break;
        case 'risk': content.innerHTML = renderOwnerRisk(); break;
        case 'security': content.innerHTML = renderOwnerSecurity(); break;
        case 'admins': content.innerHTML = renderOwnerAdmins(); break;
        case 'settings': content.innerHTML = renderOwnerSettings(); break;
    }
}

/* ============ HELPER ============ */
function ownerKpi(icon, label, value, color, sub) {
    return `
        <div class="owner-kpi-card" style="border-color: ${color};">
            <div class="kpi-header">
                <span class="kpi-icon" style="color: ${color};">${icon}</span>
            </div>
            <div class="kpi-value" style="color: ${color};">${value}</div>
            <div class="kpi-label">${label}</div>
            ${sub ? `<div class="kpi-sub" style="color: ${color};">${sub}</div>` : ''}
        </div>
    `;
}

/* ============ RENDER: DASHBOARD ============ */
function renderOwnerDashboard() {
    const stats = getOwnerStats();
    const recentOrders = getOrders().slice(0, 5);
    const recentSellers = getAllSellers().slice(0, 5);

    return `
        <div class="owner-welcome">
            <div>
                <h1>👑 Welcome, ${escapeHtml(STATE.user.name)}</h1>
                <p>Complete overview of your platform</p>
            </div>
            <div class="owner-welcome-time">${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</div>
        </div>

        <div class="owner-live-strip">
            <div class="live-item">
                <span class="live-dot"></span>
                <strong>${stats.totalUsers}</strong>
                <span>Total Users</span>
            </div>
            <div class="live-item">
                <span>🏪</span>
                <strong>${stats.totalSellers}</strong>
                <span>Sellers</span>
            </div>
            <div class="live-item">
                <span>📦</span>
                <strong>${stats.totalOrders}</strong>
                <span>Orders</span>
            </div>
            <div class="live-item">
                <span>💰</span>
                <strong>${formatPrice(stats.totalRevenue)}</strong>
                <span>Revenue</span>
            </div>
        </div>

        <div class="owner-kpi-grid">
            ${ownerKpi('💵', 'Total Revenue', formatPrice(stats.totalRevenue), '#4caf50')}
            ${ownerKpi('💎', 'Platform Commission', formatPrice(stats.totalCommission), '#ffd700')}
            ${ownerKpi('🛒', 'Total Orders', stats.totalOrders, '#2196f3')}
            ${ownerKpi('👥', 'Customers', stats.totalCustomers, '#9c27b0')}
            ${ownerKpi('🏪', 'Active Sellers', stats.approvedSellers, '#4caf50', stats.pendingSellers + ' pending')}
            ${ownerKpi('📦', 'Total Products', stats.totalProducts, '#e91e63')}
            ${ownerKpi('📊', 'Avg Order Value', formatPrice(stats.avgOrderValue), '#d4a960')}
            ${ownerKpi('👨‍💼', 'Admins', stats.totalAdmins, '#00bcd4')}
        </div>

        <div class="owner-two-col">
            <div class="owner-section-card">
                <h3>📋 Recent Orders</h3>
                ${recentOrders.length === 0 ? `
                    <div class="owner-empty">
                        <div class="empty-icon">📭</div>
                        <h4>No orders yet</h4>
                    </div>
                ` : `
                    <div class="owner-table-wrap">
                        <table class="owner-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Total</th>
                                    <th>Seller</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentOrders.map(o => `
                                    <tr>
                                        <td><strong style="color: #ffd700; font-family: monospace;">${o.id}</strong></td>
                                        <td>${escapeHtml(o.customer?.name || 'N/A')}</td>
                                        <td><strong>${formatPrice(o.total)}</strong></td>
                                        <td>${escapeHtml(o.sellerName || 'Velora')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>

            <div class="owner-section-card">
                <h3>🏪 Recent Sellers</h3>
                ${recentSellers.length === 0 ? `
                    <div class="owner-empty">
                        <div class="empty-icon">🏪</div>
                        <h4>No sellers yet</h4>
                    </div>
                ` : `
                    <div class="owner-table-wrap">
                        <table class="owner-table">
                            <thead>
                                <tr>
                                    <th>Store</th>
                                    <th>Plan</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentSellers.map(s => `
                                    <tr>
                                        <td><strong>🏪 ${escapeHtml(s.storeName)}</strong></td>
                                        <td>${SELLER_PLANS[s.plan]?.name || 'Free'}</td>
                                        <td>
                                            <span style="color: ${SELLER_STATUS_INFO[s.status].color}; font-weight: 700; font-size: 0.8rem;">
                                                ${SELLER_STATUS_INFO[s.status].icon} ${SELLER_STATUS_INFO[s.status].label}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;
}

/* ============ RENDER: LIVE ============ */
function renderOwnerLive() {
    return `
        <div class="owner-section-card">
            <h3>⚡ Live Activity</h3>
            <div class="owner-empty">
                <div class="empty-icon">⚡</div>
                <h4>Live activity tracking</h4>
                <p>Will display real-time platform activity</p>
            </div>
        </div>
    `;
}

/* ============ RENDER: REVENUE ============ */
function renderOwnerRevenue() {
    const stats = getOwnerStats();
    const orders = getOrders();

    // Calculate revenue breakdown
    const commissionRevenue = stats.totalCommission;
    const sellerRevenue = stats.totalRevenue - commissionRevenue;

    return `
        <div class="owner-kpi-grid">
            ${ownerKpi('💵', 'Total Revenue (GMV)', formatPrice(stats.totalRevenue), '#4caf50')}
            ${ownerKpi('💎', 'Commission Revenue', formatPrice(commissionRevenue), '#ffd700')}
            ${ownerKpi('🏪', 'Seller Revenue', formatPrice(sellerRevenue), '#2196f3')}
            ${ownerKpi('🛒', 'Total Orders', stats.totalOrders, '#9c27b0')}
        </div>

        <div class="owner-section-card">
            <h3>📊 Revenue Breakdown</h3>
            <div class="revenue-breakdown">
                <div class="revenue-item">
                    <div class="revenue-color" style="background: linear-gradient(135deg, #ffd700, #ff8c00);"></div>
                    <div class="revenue-info">
                        <div class="revenue-label">Platform Commission (15%)</div>
                        <div class="revenue-value">${formatPrice(commissionRevenue)}</div>
                    </div>
                    <div class="revenue-pct">${stats.totalRevenue > 0 ? '15%' : '0%'}</div>
                </div>
                <div class="revenue-item">
                    <div class="revenue-color" style="background: linear-gradient(135deg, #4caf50, #8bc34a);"></div>
                    <div class="revenue-info">
                        <div class="revenue-label">Seller Revenue (85%)</div>
                        <div class="revenue-value">${formatPrice(sellerRevenue)}</div>
                    </div>
                    <div class="revenue-pct">${stats.totalRevenue > 0 ? '85%' : '0%'}</div>
                </div>
            </div>
        </div>
    `;
}

/* ============ RENDER: CUSTOMERS ============ */
function renderOwnerCustomers() {
    const users = getAllUsersV2();
    const customers = users.filter(u => u.role === ROLES.CUSTOMER);
    const orders = getOrders();

    return `
        <div class="owner-kpi-grid">
            ${ownerKpi('👥', 'Total Customers', customers.length, '#d4708a')}
            ${ownerKpi('🆕', 'New Customers', customers.filter(u => Date.now() - u.createdAt < 7 * 24 * 60 * 60 * 1000).length, '#4caf50', 'Last 7 days')}
            ${ownerKpi('📦', 'Total Orders', orders.length, '#2196f3')}
            ${ownerKpi('💰', 'Avg Order Value', formatPrice(getOwnerStats().avgOrderValue), '#9c27b0')}
        </div>

        <div class="owner-section-card">
            <h3>👥 Customer List</h3>
            ${customers.length === 0 ? `
                <div class="owner-empty">
                    <div class="empty-icon">👥</div>
                    <h4>No customers yet</h4>
                </div>
            ` : `
                <div class="owner-table-wrap">
                    <table class="owner-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customers.map(u => `
                                <tr>
                                    <td><strong>${escapeHtml(u.name)}</strong></td>
                                    <td>${escapeHtml(u.email)}</td>
                                    <td>${escapeHtml(u.phone || 'N/A')}</td>
                                    <td>${new Date(u.createdAt).toLocaleDateString('en-US')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}


/* ============ RENDER: SELLERS ============ */
function renderOwnerSellers() {
    const sellers = getAllSellers();

    return `
        <div class="owner-kpi-grid">
            ${ownerKpi('🏪', 'Total Sellers', sellers.length, '#4caf50')}
            ${ownerKpi('✅', 'Approved', sellers.filter(s => s.status === SELLER_STATUS.APPROVED).length, '#4caf50')}
            ${ownerKpi('⏳', 'Pending', sellers.filter(s => s.status === SELLER_STATUS.PENDING).length, '#ff9800')}
            ${ownerKpi('🚫', 'Suspended', sellers.filter(s => s.status === SELLER_STATUS.SUSPENDED).length, '#9c27b0')}
        </div>

        <div class="owner-section-card">
            <h3>🏪 All Sellers</h3>
            ${sellers.length === 0 ? `
                <div class="owner-empty">
                    <div class="empty-icon">🏪</div>
                    <h4>No sellers yet</h4>
                </div>
            ` : `
                <div class="owner-table-wrap">
                    <table class="owner-table">
                        <thead>
                            <tr>
                                <th>Store</th>
                                <th>Owner</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sellers.map(s => `
                                <tr>
                                    <td><strong>🏪 ${escapeHtml(s.storeName)}</strong></td>
                                    <td>${escapeHtml(s.name)}</td>
                                    <td>${SELLER_PLANS[s.plan]?.name || 'Free'}</td>
                                    <td>
                                        <span style="color: ${SELLER_STATUS_INFO[s.status].color}; font-weight: 700; font-size: 0.8rem;">
                                            ${SELLER_STATUS_INFO[s.status].icon} ${SELLER_STATUS_INFO[s.status].label}
                                        </span>
                                    </td>
                                    <td>${new Date(s.createdAt).toLocaleDateString('en-US')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

/* ============ RENDER: PRODUCTS ============ */
function renderOwnerProducts() {
    const stats = getOwnerStats();

    return `
        <div class="owner-kpi-grid">
            ${ownerKpi('📦', 'Total Products', stats.totalProducts, '#e91e63')}
            ${ownerKpi('✅', 'Platform Products', MAHA_DATA.PRODUCTS.length, '#4caf50')}
            ${ownerKpi('🏪', 'Seller Products', stats.totalProducts - MAHA_DATA.PRODUCTS.length, '#2196f3')}
        </div>

        <div class="owner-section-card">
            <h3>📦 Product Analytics</h3>
            <div class="owner-empty">
                <div class="empty-icon">📊</div>
                <h4>Detailed analytics coming soon</h4>
                <p>Top products, views, conversions will appear here</p>
            </div>
        </div>
    `;
}

/* ============ RENDER: ORDERS ============ */
function renderOwnerOrders() {
    const orders = getOrders();
    const stats = getOwnerStats();

    return `
        <div class="owner-kpi-grid">
            ${ownerKpi('🛒', 'Total Orders', orders.length, '#2196f3')}
            ${ownerKpi('💰', 'Total Revenue', formatPrice(stats.totalRevenue), '#4caf50')}
            ${ownerKpi('📊', 'Avg Order Value', formatPrice(stats.avgOrderValue), '#d4a960')}
            ${ownerKpi('📅', 'Today', orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString()).length, '#9c27b0')}
        </div>

        <div class="owner-section-card">
            <h3>🛒 Recent Orders</h3>
            ${orders.length === 0 ? `
                <div class="owner-empty">
                    <div class="empty-icon">📭</div>
                    <h4>No orders yet</h4>
                </div>
            ` : `
                <div class="owner-table-wrap">
                    <table class="owner-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Seller</th>
                                <th>Total</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.slice(0, 20).map(o => `
                                <tr>
                                    <td><strong style="color: #ffd700; font-family: monospace;">${o.id}</strong></td>
                                    <td>${escapeHtml(o.customer?.name || 'N/A')}</td>
                                    <td>${escapeHtml(o.sellerName || 'Velora')}</td>
                                    <td><strong>${formatPrice(o.total)}</strong></td>
                                    <td>${new Date(o.date).toLocaleDateString('en-US')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

/* ============ RENDER: SEARCH INTELLIGENCE ============ */
function renderOwnerSearch() {
    return `
        <div class="owner-section-card">
            <h3>🔍 Search Intelligence</h3>
            <div class="owner-empty">
                <div class="empty-icon">🔍</div>
                <h4>Search Analytics</h4>
                <p>Track top searches, no-result searches, and search trends</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">Coming soon with user activity tracking</p>
            </div>
        </div>
    `;
}

/* ============ RENDER: FUNNEL ============ */
function renderOwnerFunnel() {
    return `
        <div class="owner-section-card">
            <h3>🎯 Conversion Funnel</h3>
            <div style="padding: 1rem 0;">
                <div class="chart-bars">
                    <div class="chart-bar-item">
                        <div class="chart-bar-label">Visitors</div>
                        <div class="chart-bar-track"><div class="chart-bar-fill" style="width: 100%;"></div></div>
                        <div class="chart-bar-value">100%</div>
                    </div>
                    <div class="chart-bar-item">
                        <div class="chart-bar-label">Product Views</div>
                        <div class="chart-bar-track"><div class="chart-bar-fill" style="width: 65%;"></div></div>
                        <div class="chart-bar-value">65%</div>
                    </div>
                    <div class="chart-bar-item">
                        <div class="chart-bar-label">Add to Cart</div>
                        <div class="chart-bar-track"><div class="chart-bar-fill" style="width: 35%;"></div></div>
                        <div class="chart-bar-value">35%</div>
                    </div>
                    <div class="chart-bar-item">
                        <div class="chart-bar-label">Checkout</div>
                        <div class="chart-bar-track"><div class="chart-bar-fill" style="width: 20%;"></div></div>
                        <div class="chart-bar-value">20%</div>
                    </div>
                    <div class="chart-bar-item">
                        <div class="chart-bar-label">Orders</div>
                        <div class="chart-bar-track"><div class="chart-bar-fill" style="width: 12%;"></div></div>
                        <div class="chart-bar-value">12%</div>
                    </div>
                </div>
            </div>
            <p style="color: #6a6a7a; font-size: 0.85rem; margin-top: 1rem; text-align: center;">Sample data — real analytics coming soon</p>
        </div>
    `;
}

/* ============ RENDER: BUSINESS INTELLIGENCE ============ */
function renderOwnerBI() {
    const stats = getOwnerStats();

    return `
        <div class="owner-kpi-grid">
            ${ownerKpi('📈', 'Growth Rate', '+0%', '#4caf50')}
            ${ownerKpi('🎯', 'Conversion Rate', '0%', '#2196f3')}
            ${ownerKpi('💎', 'Customer LTV', formatPrice(0), '#ffd700')}
            ${ownerKpi('⚡', 'Retention Rate', '0%', '#9c27b0')}
        </div>

        <div class="owner-section-card">
            <h3>🧠 Business Intelligence</h3>
            <div class="owner-empty">
                <div class="empty-icon">🧠</div>
                <h4>BI Analytics</h4>
                <p>Advanced insights and predictions coming soon</p>
            </div>
        </div>
    `;
}

/* ============ RENDER: RISK CENTER ============ */
function renderOwnerRisk() {
    return `
        <div class="owner-kpi-grid">
            ${ownerKpi('⚠️', 'Active Alerts', 0, '#ff9800')}
            ${ownerKpi('🚨', 'High Risk', 0, '#f44336')}
            ${ownerKpi('🔍', 'Under Review', 0, '#2196f3')}
            ${ownerKpi('✅', 'Resolved', 0, '#4caf50')}
        </div>

        <div class="owner-section-card">
            <h3>🛡️ Risk Center</h3>
            <div class="owner-empty">
                <div class="empty-icon">🛡️</div>
                <h4>No active risks</h4>
                <p>All systems running smoothly ✅</p>
            </div>
        </div>
    `;
}

/* ============ RENDER: SECURITY ============ */
function renderOwnerSecurity() {
    const users = getAllUsersV2();

    return `
        <div class="owner-kpi-grid">
            ${ownerKpi('🔐', 'Total Users', users.length, '#2196f3')}
            ${ownerKpi('👑', 'Owners', users.filter(u => u.role === ROLES.OWNER).length, '#ffd700')}
            ${ownerKpi('⚙️', 'Admins', users.filter(u => u.role === ROLES.ADMIN).length, '#2196f3')}
            ${ownerKpi('🏪', 'Sellers', users.filter(u => u.role === ROLES.SELLER).length, '#4caf50')}
        </div>

        <div class="owner-section-card">
            <h3>🔐 Security Center</h3>
            <div class="owner-empty">
                <div class="empty-icon">🔐</div>
                <h4>Security Monitoring</h4>
                <p>Login attempts, suspicious activity, and security alerts will appear here</p>
            </div>
        </div>
    `;
}

/* ============ RENDER: ADMINS ============ */
function renderOwnerAdmins() {
    const users = getAllUsersV2();
    const admins = users.filter(u => u.role === ROLES.ADMIN || u.role === ROLES.OWNER);

    return `
        <div class="owner-section-card">
            <h3>👨‍💼 Admin Management</h3>
            ${admins.length === 0 ? `
                <div class="owner-empty">
                    <div class="empty-icon">👨‍💼</div>
                    <h4>No admins yet</h4>
                </div>
            ` : `
                <div class="owner-table-wrap">
                    <table class="owner-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${admins.map(u => {
                                const roleInfo = ROLE_INFO[u.role];
                                return `
                                    <tr>
                                        <td><strong>${escapeHtml(u.name)}</strong></td>
                                        <td>${escapeHtml(u.email)}</td>
                                        <td>
                                            <span style="color: ${roleInfo.color}; font-weight: 700;">
                                                ${roleInfo.icon} ${roleInfo.label}
                                            </span>
                                        </td>
                                        <td>${new Date(u.createdAt).toLocaleDateString('en-US')}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

/* ============ RENDER: SETTINGS ============ */
function renderOwnerSettings() {
    return `
        <div class="owner-section-card">
            <h3>⚙️ Platform Settings</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 600px;">
                <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                    <label style="font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">Platform Name</label>
                    <input type="text" value="Velora" readonly style="padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid #2a2a3a; border-radius: 8px; color: #fff; font-family: inherit;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                    <label style="font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">Default Commission Rate</label>
                    <input type="text" value="15%" readonly style="padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid #2a2a3a; border-radius: 8px; color: #fff; font-family: inherit;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                    <label style="font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">Owner Email</label>
                    <input type="email" value="${escapeHtml(STATE.user.email)}" readonly style="padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid #2a2a3a; border-radius: 8px; color: #fff; font-family: inherit;">
                </div>
            </div>
        </div>
    `;
}

/* ============ UPDATE PLATFORM SWITCHER ============ */
const originalSwitchPlatformOwner = switchPlatform;
switchPlatform = function(platformId) {
    const menu = document.getElementById('platformSwitcherMenu');
    if (menu) menu.classList.remove('open');

    switch (platformId) {
        case 'marketplace':
            closeSellerPlatform();
            closeAdminPlatform();
            closeOwnerPlatform();
            showToast('🛒 Marketplace', 'info');
            break;
        case 'seller':
            closeOwnerPlatform();
            openSellerPlatform();
            break;
        case 'admin':
            closeOwnerPlatform();
            openAdminPlatform();
            break;
        case 'owner':
            openOwnerPlatform();
            break;
    }
};

/* ============ UPDATE PLATFORM SWITCHER MENU ============ */
function renderPlatformSwitcher() {
    if (!STATE.user) return '';

    const platforms = [];

    // Always available
    platforms.push({
        id: 'marketplace',
        name: 'Marketplace',
        icon: '🛒',
        color: '#d4708a'
    });

    // Seller platform is available to dual-role accounts as well as seller-only accounts.
    const isSeller = !!(STATE.user.sellerId || STATE.user.isSeller || (Array.isArray(STATE.user.roles) && STATE.user.roles.includes(ROLES.SELLER)) || STATE.user.role === ROLES.SELLER);
    if (isSeller) {
        platforms.push({
            id: 'seller',
            name: 'Seller Dashboard',
            icon: '🏪',
            color: '#4caf50'
        });
    }

    // Admin + Owner
    if (STATE.user.role === ROLES.ADMIN || STATE.user.role === ROLES.OWNER) {
        platforms.push({
            id: 'admin',
            name: 'Admin Panel',
            icon: '⚙️',
            color: '#2196f3'
        });
    }

    // Owner only
    if (STATE.user.role === ROLES.OWNER) {
        platforms.push({
            id: 'owner',
            name: 'Owner Center',
            icon: '👑',
            color: '#b8860b'
        });
    }

    if (platforms.length <= 1) return '';

    return `
        <div class="platform-switcher" id="platformSwitcher">
            <button class="platform-switcher-btn" onclick="togglePlatformMenu()">
                <span>🔄</span>
                <span>Switch Platform</span>
            </button>
            <div class="platform-switcher-menu" id="platformSwitcherMenu">
                ${platforms.map(p => `
                    <div class="platform-switcher-item" 
                        style="border-left-color: ${p.color};"
                        onclick="switchPlatform('${p.id}')">
                        <span>${p.icon}</span>
                        <span>${p.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/* ============ INIT ============ */
function initOwner() {
    console.log('👑 Owner Command Center ready!');
    console.log('💡 Type in console: openOwnerPlatform()');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOwner);
} else {
    initOwner();
}

/* ============ EXPOSE GLOBALLY ============ */
window.openOwnerPlatform = openOwnerPlatform;
window.closeOwnerPlatform = closeOwnerPlatform;
window.showOwnerSection = showOwnerSection;
window.toggleOwnerSidebar = toggleOwnerSidebar;

console.log('✅ Owner Command Center loaded!');

/* ============================================
   VELORA - Notifications + Reviews + Disputes + Support
   ============================================ */

console.log('🔔 Loading notifications system...');

/* ============ NOTIFICATIONS SYSTEM ============ */
const NOTIFICATIONS_KEY = 'maha_notifications';

function getAllNotifications() {
    return getFromStorage(NOTIFICATIONS_KEY, []);
}

function saveAllNotifications(notifications) {
    saveToStorage(NOTIFICATIONS_KEY, notifications);
}

function createNotification(userId, type, title, message, data = {}) {
    const notifications = getAllNotifications();
    const notif = {
        id: generateId('notif'),
        userId: userId,
        type: type,
        title: title,
        message: message,
        data: data,
        read: false,
        createdAt: Date.now()
    };
    notifications.unshift(notif);
    if (notifications.length > 200) notifications.length = 200;
    saveAllNotifications(notifications);
    return notif;
}

function getNotificationsForUser(userId) {
    return getAllNotifications().filter(n => n.userId === userId || n.userId === 'all');
}

function getUnreadCount(userId) {
    return getNotificationsForUser(userId).filter(n => !n.read).length;
}

function markNotificationRead(notifId) {
    const notifications = getAllNotifications();
    const idx = notifications.findIndex(n => n.id === notifId);
    if (idx >= 0) {
        notifications[idx].read = true;
        saveAllNotifications(notifications);
    }
}

function markAllNotificationsRead(userId) {
    const notifications = getAllNotifications();
    notifications.forEach(n => {
        if (n.userId === userId || n.userId === 'all') {
            n.read = true;
        }
    });
    saveAllNotifications(notifications);
}

/* ============ NOTIFICATION ICONS ============ */
function getNotifIcon(type) {
    const icons = {
        order: '📦',
        order_status: '🚚',
        seller_approved: '✅',
        seller_rejected: '❌',
        product_approved: '✅',
        product_rejected: '❌',
        payout: '💰',
        subscription: '💎',
        ad: '📢',
        review: '⭐',
        support: '💬',
        security: '🔐',
        welcome: '🎉',
        low_stock: '⚠️',
        return: '↩️',
        dispute: '⚖️'
    };
    return icons[type] || '🔔';
}

/* ============ RENDER: NOTIFICATION BELL ============ */
function renderNotificationBell() {
    if (!STATE.user) return '';

    const unreadCount = getUnreadCount(STATE.user.uid);

    return `
        <div class="notification-bell" id="notifBell">
            <button class="icon-btn" onclick="toggleNotifications(event)" title="Notifications">
                <span class="bell-icon">🔔</span>
                ${unreadCount > 0 ? `<span class="notif-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
            </button>
            <div class="notif-dropdown" id="notifDropdown">
                <div class="notif-header">
                    <h4>🔔 Notifications</h4>
                    ${unreadCount > 0 ? `<button onclick="markAllRead(event)">Mark all read</button>` : ''}
                </div>
                <div class="notif-list" id="notifList"></div>
            </div>
        </div>
    `;
}

function toggleNotifications(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;

    dropdown.classList.toggle('open');

    if (dropdown.classList.contains('open')) {
        renderNotificationList();
    }
}

function renderNotificationList() {
    const list = document.getElementById('notifList');
    if (!list || !STATE.user) return;

    const notifications = getNotificationsForUser(STATE.user.uid);

    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notif-empty">
                <div class="empty-icon">🔔</div>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.slice(0, 20).map(n => `
        <div class="notif-item ${!n.read ? 'unread' : ''}" onclick="handleNotifClick('${n.id}')">
            <div class="notif-icon">${getNotifIcon(n.type)}</div>
            <div class="notif-content">
                <div class="notif-title">${escapeHtml(n.title)}</div>
                <div class="notif-message">${escapeHtml(n.message)}</div>
                <div class="notif-time">${timeAgo(n.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

function handleNotifClick(notifId) {
    markNotificationRead(notifId);
    renderNotificationList();
    updateNotifBadge();

    // Close dropdown
    document.getElementById('notifDropdown')?.classList.remove('open');
}

function markAllRead(event) {
    event.stopPropagation();
    if (!STATE.user) return;
    markAllNotificationsRead(STATE.user.uid);
    renderNotificationList();
    updateNotifBadge();
}

function updateNotifBadge() {
    if (!STATE.user) return;
    const bell = document.getElementById('notifBell');
    if (!bell) return;

    const unreadCount = getUnreadCount(STATE.user.uid);
    const existingBadge = bell.querySelector('.notif-badge');

    if (unreadCount > 0) {
        if (existingBadge) {
            existingBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            const btn = bell.querySelector('.icon-btn');
            if (btn) {
                const badge = document.createElement('span');
                badge.className = 'notif-badge';
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                btn.appendChild(badge);
            }
        }
    } else if (existingBadge) {
        existingBadge.remove();
    }
}

/* ============ timeAgo HELPER ============ */
function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return m + ' min ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' hr ago';
    const d = Math.floor(h / 24);
    if (d < 30) return d + ' day' + (d > 1 ? 's' : '') + ' ago';
    return new Date(timestamp).toLocaleDateString('en-US');
}

/* ============ INJECT BELL INTO HEADER ============ */
function injectNotificationBell() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    // Remove existing
    const existing = document.getElementById('notifBell');
    if (existing) existing.remove();

    if (!STATE.user) return;

    // Add before account button
    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn && accountBtn.parentNode === headerActions) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = renderNotificationBell();
        headerActions.insertBefore(wrapper.firstElementChild, accountBtn);
    }
}

/* ============ CLOSE NOTIF ON OUTSIDE CLICK ============ */
document.addEventListener('click', (e) => {
    const bell = document.getElementById('notifBell');
    if (bell && !bell.contains(e.target)) {
        document.getElementById('notifDropdown')?.classList.remove('open');
    }
});

/* ============ REVIEWS SYSTEM UPGRADE ============ */
const REVIEWS_KEY_V2 = 'maha_reviews_v2';

function getAllReviewsV2() {
    return getFromStorage(REVIEWS_KEY_V2, []);
}

function saveAllReviewsV2(reviews) {
    saveToStorage(REVIEWS_KEY_V2, reviews);
}

function getReviewsForProduct(productId) {
    return getAllReviewsV2().filter(r => r.productId === productId);
}

function getReviewsForSeller(sellerId) {
    return getAllReviewsV2().filter(r => r.sellerId === sellerId);
}

function getAverageRating(productId) {
    const reviews = getReviewsForProduct(productId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
}

/* ============ OPEN WRITE REVIEW MODAL ============ */
function openWriteReviewModal(productId, sellerId = null) {
    if (!STATE.user) {
        showToast('⚠️ Please login first', 'warning');
        setTimeout(() => openAuthModal('login'), 500);
        return;
    }

    // Check if already reviewed
    const existing = getAllReviewsV2().find(r =>
        r.productId === productId && r.userId === STATE.user.uid
    );

    if (existing) {
        showToast('ℹ️ You already reviewed this product', 'info');
        return;
    }

    const product = MAHA_DATA.PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    let modal = document.getElementById('writeReviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'writeReviewModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 550px;">
            <div class="modal-header">
                <h2>✍️ Write Review</h2>
                <button class="modal-close" onclick="closeModal('writeReviewModal')">✕</button>
            </div>

            <div style="background: var(--bg-alt); padding: 0.85rem; border-radius: 10px; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 2rem;">${product.emoji}</span>
                <div>
                    <strong>${escapeHtml(product.name)}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(product.brand)}</div>
                </div>
            </div>

            <form onsubmit="submitReviewV2(event, '${productId}', '${sellerId || ''}')" class="auth-form">
                <div class="form-group">
                    <label>Your Rating *</label>
                    <div class="star-rating-input" id="starRatingInput">
                        ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}" onclick="setStarRating(${i})">⭐</span>`).join('')}
                    </div>
                    <input type="hidden" id="reviewRatingInput" value="5">
                </div>

                <div class="form-group">
                    <label>Review Title</label>
                    <input type="text" class="form-input" id="reviewTitleInput" placeholder="Summary" maxlength="100">
                </div>

                <div class="form-group">
                    <label>Your Review *</label>
                    <textarea class="form-textarea" id="reviewTextInput" rows="5" required placeholder="Share your experience..." minlength="10" maxlength="1000"></textarea>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-align: right;" id="reviewCharCount">0 / 1000</div>
                </div>

                <button type="submit" class="btn btn-primary btn-block btn-lg">
                    📝 Publish Review
                </button>
            </form>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Set default rating
    setTimeout(() => {
        setStarRating(5);
        const textarea = document.getElementById('reviewTextInput');
        const counter = document.getElementById('reviewCharCount');
        if (textarea && counter) {
            textarea.addEventListener('input', () => {
                counter.textContent = textarea.value.length + ' / 1000';
            });
        }
    }, 100);
}

function setStarRating(rating) {
    const stars = document.querySelectorAll('#starRatingInput .star');
    stars.forEach((s, i) => {
        s.classList.toggle('active', i < rating);
    });
    const input = document.getElementById('reviewRatingInput');
    if (input) input.value = rating;
}

function submitReviewV2(event, productId, sellerId) {
    event.preventDefault();
    if (!STATE.user) return;

    const rating = parseInt(document.getElementById('reviewRatingInput').value) || 5;
    const title = document.getElementById('reviewTitleInput').value.trim();
    const text = document.getElementById('reviewTextInput').value.trim();

    if (!text || text.length < 10) {
        showToast('⚠️ Please write at least 10 characters', 'warning');
        return;
    }

    const reviews = getAllReviewsV2();
    const review = {
        id: generateId('rev'),
        productId: productId,
        sellerId: sellerId || null,
        userId: STATE.user.uid,
        author: STATE.user.name,
        rating: rating,
        title: title,
        text: text,
        likes: 0,
        verified: true,
        createdAt: Date.now()
    };

    reviews.unshift(review);
    saveAllReviewsV2(reviews);

    // Create notification for seller
    if (sellerId) {
        const seller = getSellerById(sellerId);
        if (seller) {
            createNotification(
                seller.userId,
                'review',
                '⭐ New Review',
                `${STATE.user.name} reviewed your product with ${rating} stars`
            );
        }
    }

    closeModal('writeReviewModal');
    showToast('🎉 Review published! Thanks!', 'success');

    // Refresh current page
    if (STATE.currentPage === 'reviews') {
        renderReviewsPage();
    }
}

/* ============ OVERRIDE: Add Review Button to Product Detail ============ */
const originalOpenProductDetailNotif = openProductDetail;
openProductDetail = function(productId) {
    originalOpenProductDetailNotif(productId);

    // Add review button after modal renders
    setTimeout(() => {
        const content = document.getElementById('productModalContent');
        if (!content) return;

        const actions = content.querySelector('div[style*="display: flex"][style*="gap: 0.75rem"]');
        if (!actions) return;

        // Check if already added
        if (actions.querySelector('.review-action-btn')) return;

        const product = MAHA_DATA.PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const reviewBtn = document.createElement('button');
        reviewBtn.className = 'review-action-btn';
        reviewBtn.innerHTML = '✍️ Write Review';
        reviewBtn.onclick = () => openWriteReviewModal(productId, product.sellerId || null);
        actions.appendChild(reviewBtn);
    }, 200);
};

/* ============ DISPUTES SYSTEM ============ */
const DISPUTES_KEY = 'maha_disputes';

function getAllDisputes() {
    return getFromStorage(DISPUTES_KEY, []);
}

function saveAllDisputes(disputes) {
    saveToStorage(DISPUTES_KEY, disputes);
}

function createDispute(orderId, subject, description) {
    const disputes = getAllDisputes();
    const dispute = {
        id: generateId('disp'),
        orderId: orderId,
        userId: STATE.user.uid,
        userName: STATE.user.name,
        subject: subject,
        description: description,
        status: 'open',
        messages: [],
        createdAt: Date.now()
    };
    disputes.unshift(dispute);
    saveAllDisputes(disputes);
    return dispute;
}

/* ============ SUPPORT TICKETS SYSTEM ============ */
const TICKETS_KEY = 'maha_tickets';

function getAllTickets() {
    return getFromStorage(TICKETS_KEY, []);
}

function saveAllTickets(tickets) {
    saveToStorage(TICKETS_KEY, tickets);
}

function createTicket(subject, description, category = 'general') {
    const tickets = getAllTickets();
    const ticket = {
        id: generateId('tkt'),
        userId: STATE.user.uid,
        userName: STATE.user.name,
        email: STATE.user.email,
        subject: subject,
        description: description,
        category: category,
        status: 'open',
        messages: [],
        createdAt: Date.now()
    };
    tickets.unshift(ticket);
    saveAllTickets(tickets);
    return ticket;
}

/* ============ OPEN SUPPORT TICKET MODAL ============ */
function openSupportTicketModal() {
    if (!STATE.user) {
        showToast('⚠️ Please login first', 'warning');
        setTimeout(() => openAuthModal('login'), 500);
        return;
    }

    let modal = document.getElementById('supportTicketModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'supportTicketModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 550px;">
            <div class="modal-header">
                <h2>💬 Contact Support</h2>
                <button class="modal-close" onclick="closeModal('supportTicketModal')">✕</button>
            </div>

            <form onsubmit="submitSupportTicket(event)" class="auth-form">
                <div class="form-group">
                    <label>Category *</label>
                    <select class="form-select" id="ticketCategory" required>
                        <option value="general">General Question</option>
                        <option value="order">Order Issue</option>
                        <option value="payment">Payment Issue</option>
                        <option value="product">Product Issue</option>
                        <option value="seller">Seller Issue</option>
                        <option value="return">Return / Refund</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Subject *</label>
                    <input type="text" class="form-input" id="ticketSubject" required placeholder="Brief summary" maxlength="100">
                </div>

                <div class="form-group">
                    <label>Description *</label>
                    <textarea class="form-textarea" id="ticketDescription" rows="5" required placeholder="Describe your issue in detail..." minlength="20" maxlength="1000"></textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-block btn-lg">
                    📤 Submit Ticket
                </button>
            </form>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function submitSupportTicket(event) {
    event.preventDefault();
    if (!STATE.user) return;

    const category = document.getElementById('ticketCategory').value;
    const subject = document.getElementById('ticketSubject').value.trim();
    const description = document.getElementById('ticketDescription').value.trim();

    if (description.length < 20) {
        showToast('⚠️ Please write at least 20 characters', 'warning');
        return;
    }

    const ticket = createTicket(subject, description, category);

    // Notify owner
    createNotification(
        'all',
        'support',
        '💬 New Support Ticket',
        `${STATE.user.name}: ${subject}`
    );

    closeModal('supportTicketModal');
    showToast('🎉 Ticket submitted! We will contact you soon.', 'success');
}

/* ============ ACCOUNT ACTIVITY ============ */
function appendAccountActivity(){
  const container=document.getElementById('accountContent'); if(!container || !STATE.user) return;
  const myReviews=getAllReviewsV2().filter(r=>r.userId===STATE.user.uid);
  const myTickets=getAllTickets().filter(t=>t.userId===STATE.user.uid);
  const existing=container.querySelector('[data-velora-account-activity]'); if(existing) existing.remove();
  const wrap=document.createElement('div'); wrap.dataset.veloraAccountActivity='true';
  wrap.innerHTML=`<div style="margin-top:1.5rem;padding:1.5rem;background:var(--bg-alt);border-radius:12px"><h3 style="margin-bottom:1rem">📊 My Activity</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem"><div style="padding:1rem;background:var(--card);border-radius:10px;text-align:center"><div style="font-size:1.5rem;font-weight:900;color:var(--primary)">${myReviews.length}</div><div style="font-size:.8rem;color:var(--text-muted)">Reviews Written</div></div><div style="padding:1rem;background:var(--card);border-radius:10px;text-align:center"><div style="font-size:1.5rem;font-weight:900;color:var(--info)">${myTickets.length}</div><div style="font-size:.8rem;color:var(--text-muted)">Support Tickets</div></div></div><button class="btn btn-outline btn-block" onclick="openSupportTicketModal()">💬 Contact Support</button></div>`;
  container.appendChild(wrap.firstElementChild);
}

/* ============ NOTIFICATION HEADER ============ */

/* ============ WELCOME NOTIFICATION ============ */
function sendWelcomeNotification() {
    if (!STATE.user) return;

    const alreadySent = getAllNotifications().some(n =>
        n.userId === STATE.user.uid && n.type === 'welcome'
    );

    if (!alreadySent) {
        createNotification(
            STATE.user.uid,
            'welcome',
            '🎉 Welcome to Velora!',
            'Thanks for joining. Explore our products and start shopping!'
        );
    }
}

/* ============ ORDER NOTIFICATION ============ */
function notifyOrderPlaced(orderId) {
    if (!STATE.user) return;

    createNotification(
        STATE.user.uid,
        'order',
        '📦 Order Placed',
        `Your order ${orderId} has been placed successfully`
    );
}

/* ============ INIT ============ */
function initNotifications() {
    console.log('🔔 Initializing notifications...');

    // Wait for DOM
    setTimeout(() => {
        if (STATE.user) {
            sendWelcomeNotification();
            injectNotificationBell();
        }
    }, 1000);

    // Update bell every 30 seconds
    setInterval(() => {
        if (STATE.user) updateNotifBadge();
    }, 30000);

    console.log('✅ Notifications ready!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}

/* ============ EXPOSE GLOBALLY ============ */
window.openWriteReviewModal = openWriteReviewModal;
window.openSupportTicketModal = openSupportTicketModal;
window.createNotification = createNotification;
window.getAllReviewsV2 = getAllReviewsV2;
window.getReviewsForProduct = getReviewsForProduct;
window.getAverageRating = getAverageRating;

console.log('✅ Notifications + Reviews + Support loaded!');

/* ============================================
   VELORA - Analytics + Events + Audit Logs
   ============================================ */

console.log('📊 Loading analytics system...');

/* ============================================
   ANALYTICS EVENTS
   ============================================ */
const EVENTS_KEY = 'maha_events';
const MAX_EVENTS = 1000;

/* ============ TRACK EVENT ============ */
function trackEvent(eventName, data = {}) {
    const events = getFromStorage(EVENTS_KEY, []);
    const sessionId = getSessionId();

    const event = {
        id: generateId('evt'),
        name: eventName,
        userId: STATE.user ? STATE.user.uid : 'guest',
        sessionId: sessionId,
        data: data,
        timestamp: Date.now(),
        page: STATE.currentPage || window.location.hash.replace('#', '') || 'home',
        referrer: document.referrer || 'direct',
        deviceType: getDeviceType(),
        userAgent: navigator.userAgent.substring(0, 100)
    };

    events.push(event);
    if (events.length > MAX_EVENTS) events.shift();
    saveToStorage(EVENTS_KEY, events);

    return event;
}

function getSessionId() {
    let sid = sessionStorage.getItem('maha_session_id');
    if (!sid) {
        sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('maha_session_id', sid);
    }
    return sid;
}

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'mobile';
    return 'desktop';
}

function getAllEvents() {
    return getFromStorage(EVENTS_KEY, []);
}

/* ============ AUTO TRACK EVENTS ============ */
function setupEventTracking() {
    trackEvent('page_view', { page: STATE.currentPage || 'home' });
    console.log('✅ Event tracking active');
}

/* ============ ANALYTICS STATS ============ */
function getAnalyticsStats() {
    const events = getAllEvents();
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    const uniqueUsers = new Set(events.filter(e => e.userId !== 'guest').map(e => e.userId)).size;

    const today = new Date().setHours(0, 0, 0, 0);
    const todayEvents = events.filter(e => e.timestamp >= today);

    const thisWeek = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weekEvents = events.filter(e => e.timestamp >= thisWeek);

    return {
        totalEvents: events.length,
        uniqueSessions: uniqueSessions,
        uniqueUsers: uniqueUsers,
        todayEvents: todayEvents.length,
        weekEvents: weekEvents.length,
        pageViews: events.filter(e => e.name === 'page_view').length,
        productViews: events.filter(e => e.name === 'product_view').length,
        searches: events.filter(e => e.name === 'search').length,
        addToCarts: events.filter(e => e.name === 'add_to_cart').length,
        checkouts: events.filter(e => e.name === 'checkout_start').length,
        orders: events.filter(e => e.name === 'order_complete').length
    };
}

function getTopSearches(limit = 10) {
    const searches = getAllEvents().filter(e => e.name === 'search');
    const counts = {};
    searches.forEach(e => {
        const q = (e.data?.query || '').toLowerCase().trim();
        if (q) counts[q] = (counts[q] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));
}

function getTopProducts(limit = 10) {
    const views = getAllEvents().filter(e => e.name === 'product_view');
    const counts = {};
    views.forEach(e => {
        const pid = e.data?.productId;
        if (pid) counts[pid] = (counts[pid] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([productId, count]) => {
            const product = MAHA_DATA.PRODUCTS.find(p => p.id === productId);
            return { productId, name: product?.name || productId, emoji: product?.emoji || '📦', count };
        });
}

function getConversionFunnel() {
    const events = getAllEvents();
    const sessions = new Set(events.map(e => e.sessionId));

    const stages = [
        { name: 'Visitors', count: sessions.size },
        { name: 'Product Views', count: new Set(events.filter(e => e.name === 'product_view').map(e => e.sessionId)).size },
        { name: 'Add to Cart', count: new Set(events.filter(e => e.name === 'add_to_cart').map(e => e.sessionId)).size },
        { name: 'Checkout', count: new Set(events.filter(e => e.name === 'checkout_start').map(e => e.sessionId)).size },
        { name: 'Orders', count: new Set(events.filter(e => e.name === 'order_complete').map(e => e.sessionId)).size }
    ];

    const maxCount = Math.max(...stages.map(s => s.count), 1);
    return stages.map(s => ({
        ...s,
        percentage: Math.round((s.count / maxCount) * 100),
        conversionFromStart: sessions.size > 0 ? Math.round((s.count / sessions.size) * 100) : 0
    }));
}

/* ============================================
   AUDIT LOGS
   ============================================ */
const AUDIT_KEY = 'maha_audit_logs';
const MAX_AUDIT = 500;

function createAuditLog(action, data = {}) {
    const logs = getFromStorage(AUDIT_KEY, []);
    const log = {
        id: generateId('audit'),
        action: action,
        actor: STATE.user ? {
            uid: STATE.user.uid,
            name: STATE.user.name,
            role: STATE.user.role
        } : { uid: 'system', name: 'System', role: 'system' },
        data: data,
        timestamp: Date.now()
    };
    logs.unshift(log);
    if (logs.length > MAX_AUDIT) logs.length = MAX_AUDIT;
    saveToStorage(AUDIT_KEY, logs);
    return log;
}

function getAllAuditLogs() {
    return getFromStorage(AUDIT_KEY, []);
}

function getAuditIcon(action) {
    const icons = {
        seller_approved: '✅',
        seller_rejected: '❌',
        seller_suspended: '🚫',
        product_approved: '✅',
        product_rejected: '❌',
        product_deleted: '🗑️',
        order_placed: '📦',
        order_status_changed: '🚚',
        login: '🔓',
        logout: '🔒',
        register: '🎉',
        settings_changed: '⚙️',
        password_changed: '🔑',
        payment_received: '💰',
        payout_requested: '💸',
        coupon_applied: '🎟️',
        review_published: '⭐'
    };
    return icons[action] || '📝';
}

function formatActionName(action) {
    const names = {
        seller_approved: 'Seller Approved',
        seller_rejected: 'Seller Rejected',
        seller_suspended: 'Seller Suspended',
        product_approved: 'Product Approved',
        product_rejected: 'Product Rejected',
        product_deleted: 'Product Deleted',
        order_placed: 'Order Placed',
        order_status_changed: 'Order Status Changed',
        login: 'User Login',
        logout: 'User Logout',
        register: 'New Registration',
        settings_changed: 'Settings Changed',
        password_changed: 'Password Changed',
        payment_received: 'Payment Received',
        payout_requested: 'Payout Requested',
        coupon_applied: 'Coupon Applied',
        review_published: 'Review Published'
    };
    return names[action] || action;
}

/* ============ HOOK AUDIT INTO ACTIONS ============ */
function setupAuditHooks() {
    // Seller approval
    const originalApproveSeller = window.approveSeller;
    if (typeof originalApproveSeller === 'function') {
        window.approveSeller = function(sellerId) {
            const seller = getSellerById(sellerId);
            createAuditLog('seller_approved', { sellerId, storeName: seller?.storeName });
            return originalApproveSeller.apply(this, arguments);
        };
    }

    const originalRejectSeller = window.rejectSeller;
    if (typeof originalRejectSeller === 'function') {
        window.rejectSeller = function(sellerId) {
            const seller = getSellerById(sellerId);
            createAuditLog('seller_rejected', { sellerId, storeName: seller?.storeName });
            return originalRejectSeller.apply(this, arguments);
        };
    }

    const originalSuspendSeller = window.suspendSeller;
    if (typeof originalSuspendSeller === 'function') {
        window.suspendSeller = function(sellerId) {
            const seller = getSellerById(sellerId);
            createAuditLog('seller_suspended', { sellerId, storeName: seller?.storeName });
            return originalSuspendSeller.apply(this, arguments);
        };
    }

    // Product approval
    const originalApproveProduct = window.approveProduct;
    if (typeof originalApproveProduct === 'function') {
        window.approveProduct = function(sellerId, productId) {
            createAuditLog('product_approved', { sellerId, productId });
            return originalApproveProduct.apply(this, arguments);
        };
    }

    const originalRejectProduct = window.rejectProduct;
    if (typeof originalRejectProduct === 'function') {
        window.rejectProduct = function(sellerId, productId) {
            createAuditLog('product_rejected', { sellerId, productId });
            return originalRejectProduct.apply(this, arguments);
        };
    }

    // Logout
    const originalLogout = window.logout;
    if (typeof originalLogout === 'function') {
        window.logout = function() {
            if (STATE.user) {
                createAuditLog('logout', { userId: STATE.user.uid });
            }
            return originalLogout.apply(this, arguments);
        };
    }

    console.log('✅ Audit hooks active');
}

/* ============================================
   RENDER: ANALYTICS DASHBOARD FOR OWNER
   ============================================ */
function renderOwnerAnalyticsDashboard() {
    const stats = getAnalyticsStats();
    const topSearches = getTopSearches(10);
    const topProducts = getTopProducts(10);
    const funnel = getConversionFunnel();

    return `
        <div class="analytics-grid">
            ${ownerKpi('📊', 'Total Events', stats.totalEvents, '#4caf50')}
            ${ownerKpi('👥', 'Unique Sessions', stats.uniqueSessions, '#2196f3')}
            ${ownerKpi('👤', 'Unique Users', stats.uniqueUsers, '#9c27b0')}
            ${ownerKpi('📅', 'Today Events', stats.todayEvents, '#ff9800')}
        </div>

        <div class="chart-card">
            <h3>🎯 Conversion Funnel</h3>
            <div class="chart-bars-v2">
                ${funnel.map(stage => `
                    <div class="chart-bar-row">
                        <div class="chart-bar-label">${stage.name}</div>
                        <div class="chart-bar-track">
                            <div class="chart-bar-fill" style="width: ${stage.percentage}%;"></div>
                        </div>
                        <div class="chart-bar-value">${stage.count}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
            <div class="chart-card">
                <h3>🔍 Top Searches</h3>
                ${topSearches.length === 0 ? `
                    <div class="owner-empty">
                        <p style="color: #6a6a7a;">No searches yet</p>
                    </div>
                ` : topSearches.map(s => `
                    <div class="chart-bar-row" style="margin-bottom: 0.75rem;">
                        <div class="chart-bar-label">${escapeHtml(s.query)}</div>
                        <div class="chart-bar-track">
                            <div class="chart-bar-fill" style="width: ${(s.count / topSearches[0].count) * 100}%;"></div>
                        </div>
                        <div class="chart-bar-value">${s.count}</div>
                    </div>
                `).join('')}
            </div>

            <div class="chart-card">
                <h3>🔥 Top Products (Views)</h3>
                ${topProducts.length === 0 ? `
                    <div class="owner-empty">
                        <p style="color: #6a6a7a;">No product views yet</p>
                    </div>
                ` : topProducts.map(p => `
                    <div class="chart-bar-row" style="margin-bottom: 0.75rem;">
                        <div class="chart-bar-label">${p.emoji} ${escapeHtml(p.name.substring(0, 20))}</div>
                        <div class="chart-bar-track">
                            <div class="chart-bar-fill" style="width: ${(p.count / topProducts[0].count) * 100}%;"></div>
                        </div>
                        <div class="chart-bar-value">${p.count}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/* ============================================
   RENDER: AUDIT LOGS FOR OWNER
   ============================================ */
function renderOwnerAuditLogs() {
    const logs = getAllAuditLogs();

    return `
        <div class="owner-section-card">
            <h3>📝 Audit Logs (${logs.length})</h3>
            ${logs.length === 0 ? `
                <div class="owner-empty">
                    <div class="empty-icon">📝</div>
                    <h4>No audit logs yet</h4>
                    <p>Actions will be logged here</p>
                </div>
            ` : logs.slice(0, 50).map(log => `
                <div class="audit-log-item">
                    <div class="audit-log-actor">
                        <div class="audit-avatar">${log.actor.name.charAt(0).toUpperCase()}</div>
                    </div>
                    <div class="audit-info">
                        <div class="audit-action">
                            ${getAuditIcon(log.action)} ${formatActionName(log.action)}
                        </div>
                        <div class="audit-details">
                            By ${escapeHtml(log.actor.name)} (${log.actor.role})
                            ${log.data.storeName ? ' — ' + escapeHtml(log.data.storeName) : ''}
                            ${log.data.productId ? ' — ' + log.data.productId : ''}
                        </div>
                    </div>
                    <div class="audit-time">${timeAgo(log.timestamp)}</div>
                </div>
            `).join('')}
        </div>
    `;
}

/* ============================================
   UPDATE OWNER SECTIONS
   ============================================ */
// Override the "live" section to show real analytics
const originalRenderOwnerLive = renderOwnerLive;
renderOwnerLive = function() {
    const stats = getAnalyticsStats();
    const recentEvents = getAllEvents().slice(-20).reverse();

    return `
        <div class="analytics-grid">
            ${ownerKpi('⚡', 'Today Events', stats.todayEvents, '#ffd700')}
            ${ownerKpi('📊', 'Week Events', stats.weekEvents, '#4caf50')}
            ${ownerKpi('👥', 'Active Sessions', stats.uniqueSessions, '#2196f3')}
            ${ownerKpi('👤', 'Active Users', stats.uniqueUsers, '#9c27b0')}
        </div>

        <div class="chart-card" style="background: #12121a; border-color: #2a2a3a;">
            <h3 style="color: #fff;">⚡ Recent Activity Stream</h3>
            ${recentEvents.length === 0 ? `
                <div class="owner-empty">
                    <div class="empty-icon">📭</div>
                    <h4>No activity yet</h4>
                </div>
            ` : recentEvents.map(e => `
                <div class="event-log-item" style="background: rgba(255,255,255,0.03);">
                    <div class="event-log-icon">${getEventIconV2(e.name)}</div>
                    <div class="event-log-content">
                        <div class="event-log-name" style="color: #fff;">${formatEventNameV2(e.name)}</div>
                        <div class="event-log-data" style="color: #8a8a9a;">${JSON.stringify(e.data).substring(0, 80)}</div>
                    </div>
                    <div class="event-log-time" style="color: #6a6a7a;">${timeAgo(e.timestamp)}</div>
                </div>
            `).join('')}
        </div>
    `;
};

function getEventIconV2(name) {
    const icons = {
        page_view: '📄',
        product_view: '👁️',
        search: '🔍',
        add_to_cart: '🛒',
        remove_from_cart: '🗑️',
        checkout_start: '💳',
        order_complete: '✅',
        login_attempt: '🔓',
        login_success: '✅',
        register_success: '🎉',
        add_to_favorites: '❤️',
        remove_from_favorites: '💔',
        add_to_compare: '⚖️'
    };
    return icons[name] || '📌';
}

function formatEventNameV2(name) {
    const names = {
        page_view: 'Page View',
        product_view: 'Product Viewed',
        search: 'Searched',
        add_to_cart: 'Added to Cart',
        remove_from_cart: 'Removed from Cart',
        checkout_start: 'Checkout Started',
        order_complete: 'Order Completed',
        login_attempt: 'Login Attempt',
        login_success: 'Login Success',
        register_success: 'New Registration',
        add_to_favorites: 'Added to Favorites',
        remove_from_favorites: 'Removed from Favorites',
        add_to_compare: 'Added to Compare'
    };
    return names[name] || name;
}

/* ============================================
   ADD AUDIT LOGS SECTION TO OWNER
   ============================================ */
function addAuditToOwnerNav() {
    const nav = document.querySelector('.owner-nav');
    if (!nav) return;

    if (nav.querySelector('[data-section="audit"]')) return;

    const section = nav.querySelector('.owner-nav-section:last-of-type');
    if (!section) return;

    const auditItem = document.createElement('div');
    auditItem.className = 'owner-nav-item';
    auditItem.setAttribute('data-section', 'audit');
    auditItem.setAttribute('onclick', "showOwnerSection('audit', this)");
    auditItem.innerHTML = '<span>📝</span><span>Audit Logs</span>';

    section.insertBefore(auditItem, section.lastElementChild);
}

// Update showOwnerSection to handle audit
const originalShowOwnerSection = showOwnerSection;
showOwnerSection = function(section, btn) {
    if (section === 'audit') {
        OWNER_STATE.currentSection = 'audit';

        document.querySelectorAll('.owner-nav-item').forEach(item => item.classList.remove('active'));
        if (btn) btn.classList.add('active');

        const titleEl = document.getElementById('ownerHeaderTitle');
        if (titleEl) titleEl.textContent = 'Audit Logs';

        const content = document.getElementById('ownerContent');
        if (content) content.innerHTML = renderOwnerAuditLogs();

        return;
    }

    if (section === 'search') {
        OWNER_STATE.currentSection = 'search';

        document.querySelectorAll('.owner-nav-item').forEach(item => item.classList.remove('active'));
        if (btn) btn.classList.add('active');

        const titleEl = document.getElementById('ownerHeaderTitle');
        if (titleEl) titleEl.textContent = 'Search Intelligence';

        const content = document.getElementById('ownerContent');
        if (content) content.innerHTML = renderOwnerSearchIntelligence();

        return;
    }

    return originalShowOwnerSection.apply(this, arguments);
};

/* ============================================
   RENDER: SEARCH INTELLIGENCE (Real Data)
   ============================================ */
function renderOwnerSearchIntelligence() {
    const topSearches = getTopSearches(20);
    const allSearches = getAllEvents().filter(e => e.name === 'search');

    // No-result searches (simplified: searches that didn't lead to product view within same session)
    const searchesWithNoResults = [];
    allSearches.forEach(s => {
        const hasProductView = getAllEvents().some(e =>
            e.sessionId === s.sessionId &&
            e.name === 'product_view' &&
            e.timestamp > s.timestamp &&
            e.timestamp < s.timestamp + 60000
        );
        if (!hasProductView) {
            searchesWithNoResults.push(s.data?.query);
        }
    });

    const uniqueNoResults = [...new Set(searchesWithNoResults)].slice(0, 10);

    return `
        <div class="analytics-grid">
            ${ownerKpi('🔍', 'Total Searches', allSearches.length, '#4caf50')}
            ${ownerKpi('📊', 'Unique Terms', topSearches.length, '#2196f3')}
            ${ownerKpi('❌', 'No Results', uniqueNoResults.length, '#f44336')}
            ${ownerKpi('⭐', 'Top Search', topSearches[0]?.query || '—', '#ffd700')}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
            <div class="chart-card">
                <h3>🔥 Top Searches</h3>
                ${topSearches.length === 0 ? `
                    <div class="owner-empty">
                        <p style="color: #6a6a7a;">No searches yet</p>
                    </div>
                ` : topSearches.map(s => `
                    <div class="chart-bar-row" style="margin-bottom: 0.75rem;">
                        <div class="chart-bar-label">${escapeHtml(s.query)}</div>
                        <div class="chart-bar-track">
                            <div class="chart-bar-fill" style="width: ${(s.count / topSearches[0].count) * 100}%;"></div>
                        </div>
                        <div class="chart-bar-value">${s.count}</div>
                    </div>
                `).join('')}
            </div>

            <div class="chart-card">
                <h3>⚠️ Searches with No Results</h3>
                ${uniqueNoResults.length === 0 ? `
                    <div class="owner-empty">
                        <p style="color: #6a6a7a;">All searches had results ✅</p>
                    </div>
                ` : uniqueNoResults.map(q => `
                    <div style="padding: 0.5rem 0.75rem; background: rgba(244,67,54,0.1); border-radius: 6px; margin-bottom: 0.5rem; color: #f44336; font-size: 0.85rem; font-weight: 600;">
                        ${escapeHtml(q)}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/* ============================================
   LOG INITIAL EVENT
   ============================================ */
function logAppInit() {
    trackEvent('app_init', {
        userAgent: navigator.userAgent.substring(0, 50),
        language: navigator.language
    });
}

/* ============================================
   INIT
   ============================================ */
function initAnalytics() {
    console.log('📊 Initializing analytics...');

    setupEventTracking();
    setupAuditHooks();

    // Add audit to owner nav
    setTimeout(addAuditToOwnerNav, 2000);

    // Log init
    logAppInit();

    console.log('✅ Analytics ready!');
    console.log('📊 Total events:', getAllEvents().length);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
    initAnalytics();
}

/* ============ EXPOSE GLOBALLY ============ */
window.trackEvent = trackEvent;
window.getAllEvents = getAllEvents;
window.getAllAuditLogs = getAllAuditLogs;
window.getAnalyticsStats = getAnalyticsStats;
window.createAuditLog = createAuditLog;

console.log('✅ Analytics + Events + Audit loaded!');


/* ============================================================
   VELORA MARKETPLACE CATALOG BRIDGE — SINGLE SOURCE
   ============================================================ */
(function(){
  'use strict';
  const seedProducts = [
    {id:'mp-el-001',name:'Wireless Earbuds Pro',brand:'Velora Select',category:'electronics',subcategory:'Audio',emoji:'🎧',price:1299,oldPrice:1599,rating:4.7,reviewsCount:86,stock:34,badge:'hot',description:'Compact wireless earbuds with charging case and everyday battery life.',tags:['earbuds','audio','wireless','electronics']},
    {id:'mp-el-002',name:'Smart Watch Active',brand:'Pulse Tech',category:'electronics',subcategory:'Wearables',emoji:'⌚',price:1899,oldPrice:2299,rating:4.5,reviewsCount:61,stock:21,badge:'bestseller',description:'A smart watch for activity tracking, notifications and everyday use.',tags:['watch','smartwatch','tech','electronics']},
    {id:'mp-fa-001',name:'Everyday Street Sneakers',brand:'North Lane',category:'fashion',subcategory:'Shoes',emoji:'👟',price:1499,oldPrice:1799,rating:4.6,reviewsCount:74,stock:42,badge:'hot',description:'Comfortable everyday sneakers designed for casual city wear.',tags:['shoes','sneakers','fashion']},
    {id:'mp-fa-002',name:'Classic Crossbody Bag',brand:'Mira Studio',category:'fashion',subcategory:'Accessories',emoji:'👜',price:999,oldPrice:1250,rating:4.4,reviewsCount:39,stock:18,description:'A compact crossbody bag with practical space for everyday essentials.',tags:['bag','fashion','accessories']},
    {id:'mp-ho-001',name:'Minimal Desk Lamp',brand:'HomeForm',category:'home',subcategory:'Lighting',emoji:'💡',price:649,oldPrice:799,rating:4.6,reviewsCount:53,stock:27,badge:'bestseller',description:'Adjustable desk lamp for workspaces, reading corners and home offices.',tags:['lamp','home','desk','lighting']},
    {id:'mp-ho-002',name:'Soft Throw Blanket',brand:'Cozy Home',category:'home',subcategory:'Living',emoji:'🛋️',price:549,oldPrice:699,rating:4.8,reviewsCount:112,stock:55,description:'A soft everyday throw for sofas, beds and relaxed evenings.',tags:['blanket','home','living']},
    {id:'mp-sp-001',name:'Training Football',brand:'Goal Line',category:'sports',subcategory:'Football',emoji:'⚽',price:599,oldPrice:750,rating:4.5,reviewsCount:48,stock:40,description:'Durable football for regular training and casual matches.',tags:['football','sports','training']},
    {id:'mp-sp-002',name:'Everyday Yoga Mat',brand:'MoveWell',category:'sports',subcategory:'Fitness',emoji:'🧘',price:749,oldPrice:899,rating:4.7,reviewsCount:67,stock:31,badge:'bestseller',description:'Comfortable exercise mat for stretching, yoga and home workouts.',tags:['yoga','fitness','sports','mat']}
  ];
  function addSeedProducts(){
    if(!window.MAHA_DATA || !Array.isArray(MAHA_DATA.PRODUCTS)) return;
    for(const p of seedProducts) if(!MAHA_DATA.PRODUCTS.some(x=>x&&x.id===p.id)) MAHA_DATA.PRODUCTS.push(p);
  }
  function getPublicSellerProducts(){
    const out=[];
    try{
      for(const seller of getAllSellers()){
        if(!seller || seller.status!==SELLER_STATUS.APPROVED) continue;
        for(const p of (getSellerProducts(seller.id)||[])){
          if(p && p.status===PRODUCT_STATUS.APPROVED) out.push({...p,sellerId:seller.id,storeName:seller.storeName,sellerName:seller.name,currency:p.currency||seller.currency||getVeloraDisplayCurrency()});
        }
      }
    }catch(e){ console.warn('Seller catalog bridge:',e); }
    return out;
  }
  function syncPublicCatalog(){
    if(!window.MAHA_DATA || !Array.isArray(MAHA_DATA.PRODUCTS)) return;
    const sellerProducts=getPublicSellerProducts();
    const base=MAHA_DATA.PRODUCTS.filter(p=>!p?.sellerId);
    MAHA_DATA.PRODUCTS=base.concat(sellerProducts);
  }
  window.syncSellerProductsToMarketplace=syncPublicCatalog;
  window.getPublicSellerProducts=getPublicSellerProducts;
  addSeedProducts();
  syncPublicCatalog();
  setTimeout(()=>{const c=document.getElementById('statProducts'); if(c&&window.MAHA_DATA)c.textContent=MAHA_DATA.PRODUCTS.length+'+';},100);
})();


/* ============================================================
   VELORA BOOT CONSOLIDATION
   ============================================================ */
(function(){
  const applyPrefs=()=>{
    const lang=getVeloraLanguage();
    setVeloraLanguage(lang);
    const cur=getVeloraDisplayCurrency();
    if(VELORA_CURRENCY_META[cur]) VELORA_CURRENCY=cur;
    const c=document.getElementById('currencySelect'); if(c)c.value=cur;
    const l=document.getElementById('languageSelect'); if(l)l.value=lang;
    persistVeloraUser();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyPrefs,{once:true}); else applyPrefs();
})();


/* ============================================================
   VELORA STAGE 7 — GLOBAL MARKETPLACE EXPERIENCE ADAPTER
   ------------------------------------------------------------
   Canonical marketplace reads + smart country/currency context.
   Legacy UI remains as a compatibility shell while canonical
   Supabase data becomes the preferred source of truth.
   ============================================================ */
(function(){
  'use strict';

  const client = window.mahaSupabase;
  if (!client) return;

  window.VELORA_CANONICAL_CATALOG = window.VELORA_CANONICAL_CATALOG || [];
  window.VELORA_MARKET_CONTEXT = window.VELORA_MARKET_CONTEXT || {
    countryCode: null,
    currencyCode: null,
    languageCode: null
  };

  const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

  async function getAuthenticatedProfile(){
    try {
      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return null;
      const { data: profile } = await client.from('profiles')
        .select('id,country_code,preferred_language,preferred_currency,status')
        .eq('id', user.id)
        .maybeSingle();
      return { user, profile };
    } catch (_) {
      return null;
    }
  }

  function detectCountryFromLocale(){
    try {
      const locale = navigator.language || '';
      const match = locale.match(/[-_]([A-Z]{2})$/i);
      return match ? match[1].toUpperCase() : null;
    } catch (_) { return null; }
  }

  async function loadMarketContext(){
    const auth = await getAuthenticatedProfile();
    const profile = auth?.profile || {};
    const countryCode = (profile.country_code || detectCountryFromLocale() || '').toUpperCase() || null;
    let currencyCode = (profile.preferred_currency || localStorage.getItem('velora_currency') || '').toUpperCase() || null;

    if (countryCode) {
      try {
        const { data: primary } = await client.from('country_currencies')
          .select('currency_code,is_primary')
          .eq('country_code', countryCode)
          .eq('is_active', true)
          .order('is_primary', { ascending: false })
          .limit(5);
        if (!currencyCode && primary?.length) currencyCode = primary.find(x => x.is_primary)?.currency_code || primary[0].currency_code;
      } catch (_) {}
    }

    window.VELORA_MARKET_CONTEXT = {
      countryCode,
      currencyCode,
      languageCode: profile.preferred_language || (typeof getVeloraLanguage === 'function' ? getVeloraLanguage() : 'en')
    };
    return window.VELORA_MARKET_CONTEXT;
  }

  async function loadRelevantCurrencies(){
    const ctx = window.VELORA_MARKET_CONTEXT || await loadMarketContext();
    const { data, error } = await client.rpc('velora_get_relevant_checkout_currencies', {
      p_country_code: ctx.countryCode,
      p_preferred_currency: ctx.currencyCode,
      p_limit: 12
    });
    if (error || !Array.isArray(data)) return [];

    const select = document.getElementById('currencySelect');
    if (select && data.length) {
      const uiCurrencies = data.filter(c => !window.VELORA_CURRENCY_META || window.VELORA_CURRENCY_META[c.code]);
      const visible = uiCurrencies.length ? uiCurrencies : data;
      const current = select.value || ctx.currencyCode || visible[0].code;
      select.innerHTML = visible.map(c => `<option value=\"${escapeHtml(String(c.code))}\">${escapeHtml(String(c.code))}</option>`).join('');
      const selected = visible.some(c => c.code === current) ? current : visible[0].code;
      select.value = selected;
      if (typeof setVeloraCurrency === 'function') setVeloraCurrency(selected);
      window.VELORA_MARKET_CONTEXT.currencyCode = selected;
    }
    return data;
  }

  async function loadCanonicalCatalog(options={}){
    const ctx = window.VELORA_MARKET_CONTEXT || await loadMarketContext();
    const { data, error } = await client.rpc('velora_get_marketplace_catalog', {
      p_country_code: options.countryCode ?? null,
      p_currency_code: options.currencyCode ?? ctx.currencyCode ?? null,
      p_category_slug: options.categorySlug ?? null,
      p_search: options.search ?? null,
      p_limit: options.limit ?? 48,
      p_offset: options.offset ?? 0
    });
    if (error) {
      console.warn('Velora canonical catalog unavailable:', error.message);
      return [];
    }
    window.VELORA_CANONICAL_CATALOG = Array.isArray(data) ? data : [];
    window.VELORA_CANONICAL_CATALOG_LOADED_AT = Date.now();
    return window.VELORA_CANONICAL_CATALOG;
  }

  function injectCheckoutCountry(){
    const form = document.getElementById('checkoutForm');
    if (!form || document.getElementById('veloraCheckoutCountry')) return;
    const target = document.getElementById('custCity')?.closest('.form-row');
    const wrap = document.createElement('div');
    wrap.className = 'form-group';
    wrap.id = 'veloraCheckoutCountry';
    wrap.innerHTML = '<label>Country / Region *</label><select class="form-input" id="veloraCountryCode" required><option value="">Loading countries…</option></select>';
    if (target?.parentElement) target.parentElement.insertBefore(wrap, target);
    else form.querySelector('.form-section')?.appendChild(wrap);

    client.from('countries')
      .select('code,name')
      .eq('is_active', true)
      .order('name')
      .then(({data}) => {
        const select = document.getElementById('veloraCountryCode');
        if (!select) return;
        const ctx = window.VELORA_MARKET_CONTEXT || {};
        select.innerHTML = '<option value="">Select country</option>' + (data || []).map(c => `<option value="${escapeHtml(c.code)}">${escapeHtml(c.name)} (${escapeHtml(c.code)})</option>`).join('');
        if (ctx.countryCode) select.value = ctx.countryCode;
        select.addEventListener('change', async () => {
          const code = select.value;
          window.VELORA_MARKET_CONTEXT.countryCode = code || null;
          await loadRelevantCurrencies();
        });
      });
  }

  const originalRenderCheckout = window.renderCheckoutPage;
  if (typeof originalRenderCheckout === 'function') {
    window.renderCheckoutPage = function(){
      const result = originalRenderCheckout.apply(this, arguments);
      setTimeout(injectCheckoutCountry, 0);
      return result;
    };
  }

  const originalPlaceOrder = window.placeOrder;
  window.placeOrder = async function(event){
    event.preventDefault();
    const items = Array.isArray(window.STATE?.cart) ? window.STATE.cart : [];
    const canonicalItems = items
      .map(item => ({ product_id: item.canonicalId || item.productId || item.id, quantity: Number(item.quantity || 1) }))
      .filter(item => isUuid(item.product_id));

    const name = document.getElementById('custName')?.value.trim() || '';
    const phone = document.getElementById('custPhone')?.value.trim() || '';
    const email = document.getElementById('custEmail')?.value.trim() || '';
    const city = document.getElementById('custCity')?.value.trim() || '';
    const address = document.getElementById('custAddress')?.value.trim() || '';
    const notes = document.getElementById('custNotes')?.value.trim() || '';
    const country = document.getElementById('veloraCountryCode')?.value || window.VELORA_MARKET_CONTEXT?.countryCode || null;

    if (!name || !phone || !city || !address || !country) {
      showToast('⚠️ Please complete your shipping information', 'warning');
      return;
    }

    try {
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session?.user) {
        showToast('🔐 Please sign in before placing an order.', 'warning');
        if (typeof handleAccountClick === 'function') handleAccountClick();
        return;
      }

      const ctx = window.VELORA_MARKET_CONTEXT || await loadMarketContext();
      const currency = document.getElementById('currencySelect')?.value || ctx.currencyCode;

      if (canonicalItems.length === items.length && canonicalItems.length > 0) {
        const { data, error } = await client.rpc('velora_create_order', {
          p_items: canonicalItems,
          p_currency: currency,
          p_shipping: 0,
          p_customer_name: name,
          p_customer_phone: phone,
          p_customer_email: email,
          p_customer_city: city,
          p_customer_address: address,
          p_customer_notes: JSON.stringify({ notes, country_code: country }),
          p_checkout_reference: 'VELORA-' + Date.now() + '-' + Math.random().toString(36).slice(2,10)
        });
        if (error) throw error;
        if (data?.ok) {
          STATE.cart = [];
          saveToStorage(KEYS.CART, STATE.cart);
          updateCartBadge();
          showToast(`🎉 Order #${data.order_number} created`, 'success');
          setTimeout(() => navigateTo('orders'), 700);
          return;
        }
        throw new Error('Order creation failed');
      }

      // Compatibility fallback for legacy/demo products that have not yet been
      // mapped to canonical Supabase product UUIDs.
      if (typeof originalPlaceOrder === 'function') return originalPlaceOrder(event);
      throw new Error('No compatible checkout path');
    } catch (err) {
      console.error('Velora checkout error:', err);
      showToast('❌ We could not complete the order. Please try again.', 'error');
    }
  };

  window.veloraLoadCanonicalCatalog = loadCanonicalCatalog;
  window.veloraLoadMarketContext = loadMarketContext;
  window.veloraLoadRelevantCurrencies = loadRelevantCurrencies;

  async function bootStage7(){
    try {
      await loadMarketContext();
      await loadRelevantCurrencies();
      await loadCanonicalCatalog({limit:48});
      if (typeof window.renderCheckoutPage === 'function' && document.getElementById('page-checkout')?.classList.contains('active')) {
        window.renderCheckoutPage();
      }
    } catch (err) {
      console.warn('Velora Stage 7 boot:', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootStage7, {once:true});
  else bootStage7();
})();


/* ============================================================
   VELORA STAGE 7.2 — CANONICAL CATALOG/UI WIRING
   ------------------------------------------------------------
   Makes Supabase canonical catalog the preferred source for
   marketplace rendering while preserving legacy seed fallback.
   ============================================================ */
(function(){
  'use strict';
  const client = window.mahaSupabase;
  if(!client) return;

  const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

  function normalizeCanonicalProduct(row){
    if(!row) return null;
    const price = Number(row.display_price ?? row.price ?? row.seller_price ?? 0);
    const oldPrice = row.original_price != null ? Number(row.original_price) : null;
    return {
      id: row.product_id || row.id,
      canonicalId: row.product_id || row.id,
      name: row.product_name || row.name || 'Product',
      brand: row.brand || row.seller_name || row.store_name || 'Velora Seller',
      category: row.category_slug || row.category || 'all',
      subcategory: row.subcategory || row.category_name || '',
      description: row.description || '',
      price: Number.isFinite(price) ? price : 0,
      oldPrice: Number.isFinite(oldPrice) ? oldPrice : null,
      rating: Number(row.rating ?? 0),
      reviewsCount: Number(row.review_count ?? row.reviews_count ?? 0),
      stock: Number(row.stock ?? row.stock_quantity ?? 0),
      badge: row.badge || '',
      emoji: row.emoji || '📦',
      images: Array.isArray(row.images) ? row.images : [],
      currency: row.currency_code || row.display_currency || null,
      sellerId: row.seller_id || null,
      storeId: row.store_id || null,
      storeName: row.store_name || '',
      sellerName: row.seller_name || '',
      tags: Array.isArray(row.tags) ? row.tags : []
    };
  }

  function mergeCanonicalIntoLegacy(rows){
    if(!Array.isArray(rows) || !window.MAHA_DATA || !Array.isArray(MAHA_DATA.PRODUCTS)) return [];
    const normalized = rows.map(normalizeCanonicalProduct).filter(Boolean);
    const canonicalIds = new Set(normalized.map(p=>String(p.id)));
    const legacyNonCanonical = MAHA_DATA.PRODUCTS.filter(p=>!isUuid(p?.id) || !canonicalIds.has(String(p.id)));
    const merged = legacyNonCanonical.concat(normalized);
    MAHA_DATA.PRODUCTS = merged;
    return normalized;
  }

  async function refreshCanonicalCatalog(options={}){
    try{
      const rows = await window.veloraLoadCanonicalCatalog({
        countryCode: options.countryCode ?? window.VELORA_MARKET_CONTEXT?.countryCode ?? null,
        currencyCode: options.currencyCode ?? window.VELORA_MARKET_CONTEXT?.currencyCode ?? null,
        categorySlug: options.categorySlug ?? (STATE.currentCategory !== 'all' ? STATE.currentCategory : null),
        search: options.search ?? STATE.searchQuery ?? null,
        limit: options.limit ?? 48,
        offset: options.offset ?? 0
      });
      return mergeCanonicalIntoLegacy(rows);
    }catch(e){
      console.warn('Canonical catalog refresh failed:', e);
      return [];
    }
  }

  async function renderCanonicalShop(){
    const container=document.getElementById('shopProducts');
    if(!container) return;
    const counter=document.getElementById('resultsCount');
    container.innerHTML='<div class="empty-state"><div class="empty-icon">⏳</div><h3>Loading marketplace</h3><p>Finding products available in your region…</p></div>';

    const canonical=await refreshCanonicalCatalog({search:STATE.searchQuery});
    let products=canonical;
    if(!products.length && window.VELORA_CANONICAL_CATALOG_LOADED_AT){
      products=[];
    }
    if(!products.length){
      // Safe legacy fallback while the global catalog has no approved rows yet.
      products=discoverProductsAPI({
        query: STATE.searchQuery,
        filters:{category:STATE.currentCategory!=='all'?STATE.currentCategory:undefined},
        sortKey: STATE.currentSort==='featured'?'default':STATE.currentSort
      });
    }
    if(counter) counter.textContent=products.length;
    container.innerHTML=products.length
      ? products.map(renderProductCard).join('')
      : '<div class="empty-state"><div class="empty-icon">🔍</div><h3>No products found</h3><p>Try different keywords or filters.</p></div>';
  }

  async function renderCanonicalFeatured(){
    const container=document.getElementById('featuredProducts');
    if(!container) return;
    const canonical=await refreshCanonicalCatalog({limit:8});
    const products=canonical.length ? canonical.slice(0,8) : MAHA_DATA.PRODUCTS.filter(p=>p.badge==='bestseller'||p.badge==='hot').slice(0,8);
    container.innerHTML=products.map(renderProductCard).join('');
  }

  async function renderCanonicalDeals(){
    const container=document.getElementById('dealsProducts');
    if(!container) return;
    const canonical=await refreshCanonicalCatalog({limit:12});
    const products=(canonical.length?canonical:MAHA_DATA.PRODUCTS).slice(0,12);
    container.innerHTML=products.map(renderProductCard).join('');
  }

  const originalLoadPageContent = window.loadPageContent;
  window.loadPageContent = function(page){
    if(typeof originalLoadPageContent==='function') originalLoadPageContent(page);
    if(page==='home') setTimeout(renderCanonicalFeatured,0);
    if(page==='shop') setTimeout(renderCanonicalShop,0);
    if(page==='deals') setTimeout(renderCanonicalDeals,0);
  };

  const originalHandleShopSearch=window.handleShopSearch;
  window.handleShopSearch=function(query){
    STATE.searchQuery=query || '';
    const clearBtn=document.getElementById('clearSearch');
    if(clearBtn) clearBtn.style.display=STATE.searchQuery?'flex':'none';
    renderCanonicalShop();
  };

  const originalFilterShop=window.filterShop;
  window.filterShop=function(category,btn){
    STATE.currentCategory=category;
    document.querySelectorAll('.filter-tab').forEach(t=>t.classList.remove('active'));
    if(btn) btn.classList.add('active');
    renderCanonicalShop();
  };

  window.veloraRefreshMarketplace=async function(){
    await window.veloraLoadMarketContext();
    await window.veloraLoadRelevantCurrencies();
    const page=STATE.currentPage || 'home';
    if(page==='home') return renderCanonicalFeatured();
    if(page==='shop') return renderCanonicalShop();
    if(page==='deals') return renderCanonicalDeals();
  };

  // Initial canonical refresh after the existing Stage 7 boot completes.
  setTimeout(()=>{
    if(STATE.currentPage==='home') renderCanonicalFeatured();
  },1200);
})();


/* ============================================================
   VELORA STAGE 7.3 — CLOUD CART / WISHLIST / CATALOG DETAIL
   ------------------------------------------------------------
   Supabase is the authenticated source of truth for cart and
   wishlist data. localStorage remains a compatibility cache.
   ============================================================ */
(function(){
  'use strict';
  const client = window.mahaSupabase;
  if(!client) return;

  const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUuid=v=>UUID_RE.test(String(v||''));

  async function currentUser(){
    try{
      const {data}=await client.auth.getSession();
      return data?.session?.user||null;
    }catch(_){ return null; }
  }

  async function syncCloudCartFromServer(){
    const user=await currentUser();
    if(!user) return false;
    try{
      const {data,error}=await client.from('carts')
        .select('id,currency_code,cart_items(id,product_id,product_variant_id,quantity,products(id,name,price,original_price,emoji,images,currency_code,store_id,seller_id))')
        .eq('customer_id',user.id)
        .maybeSingle();
      if(error || !data) return false;
      const items=Array.isArray(data.cart_items)?data.cart_items:[];
      STATE.cart=items.map(row=>{
        const prod=row.products||{};
        return {
          id:prod.id||row.product_id,
          canonicalId:prod.id||row.product_id,
          productId:prod.id||row.product_id,
          name:prod.name||'Product',
          price:Number(prod.price||0),
          oldPrice:prod.original_price!=null?Number(prod.original_price):null,
          emoji:prod.emoji||'📦',
          quantity:Number(row.quantity||1),
          currency:prod.currency_code||data.currency_code||VELORA_CURRENCY,
          storeId:prod.store_id||null,
          sellerId:prod.seller_id||null,
          variantId:row.product_variant_id||null
        };
      }).filter(x=>isUuid(x.id));
      saveToStorage(KEYS.CART,STATE.cart);
      updateCartBadge();
      if(typeof renderCartSidebar==='function') renderCartSidebar();
      if(typeof renderCartPage==='function' && STATE.currentPage==='cart') renderCartPage();
      return true;
    }catch(err){
      console.warn('Velora cloud cart sync:',err);
      return false;
    }
  }

  async function pushCartItem(productId,quantity){
    const user=await currentUser();
    if(!user || !isUuid(productId)) return;
    try{
      const currency=window.VELORA_MARKET_CONTEXT?.currencyCode||VELORA_CURRENCY||'USD';
      if(quantity<=0){
        await client.rpc('velora_remove_cart_item',{p_product_id:productId});
      }else{
        await client.rpc('velora_upsert_cart_item',{p_product_id:productId,p_quantity:Number(quantity),p_currency:currency});
      }
    }catch(err){ console.warn('Velora cloud cart write:',err); }
  }

  const originalAddToCart=window.addToCart;
  window.addToCart=function(productId,quantity=1){
    const product=MAHA_DATA.PRODUCTS.find(p=>p.id===productId);
    const result=typeof originalAddToCart==='function' ? originalAddToCart.apply(this,arguments) : undefined;
    if(product && isUuid(product.id)){
      const item=STATE.cart.find(x=>x.id===product.id);
      if(item) item.canonicalId=product.id;
      pushCartItem(product.id,item?.quantity||quantity);
    }
    return result;
  };

  const originalRemoveFromCart=window.removeFromCart;
  window.removeFromCart=function(productId){
    const result=typeof originalRemoveFromCart==='function' ? originalRemoveFromCart.apply(this,arguments) : undefined;
    if(isUuid(productId)) pushCartItem(productId,0);
    return result;
  };

  const originalUpdateQuantity=window.updateQuantity;
  window.updateQuantity=function(productId,change){
    const item=STATE.cart.find(i=>i.id===productId);
    const before=Number(item?.quantity||0);
    const result=typeof originalUpdateQuantity==='function' ? originalUpdateQuantity.apply(this,arguments) : undefined;
    if(isUuid(productId)){
      const afterItem=STATE.cart.find(i=>i.id===productId);
      pushCartItem(productId,Number(afterItem?.quantity||0));
    }
    return result;
  };

  const originalToggleFavorite=window.toggleFavorite;
  window.toggleFavorite=function(productId,btn){
    const result=typeof originalToggleFavorite==='function' ? originalToggleFavorite.apply(this,arguments) : undefined;
    if(isUuid(productId)){
      currentUser().then(user=>{
        if(!user) return;
        client.rpc('velora_toggle_wishlist',{p_product_id:productId})
          .catch(err=>console.warn('Velora cloud wishlist:',err));
      });
    }
    return result;
  };

  async function syncCloudWishlist(){
    const user=await currentUser();
    if(!user) return false;
    try{
      const {data,error}=await client.rpc('velora_get_wishlist');
      if(error || !Array.isArray(data)) return false;
      const mapped=data.map(row=>({
        id:row.product_id||row.id,
        canonicalId:row.product_id||row.id,
        name:row.product_name||row.name||'Product',
        price:Number(row.price||0),
        emoji:row.emoji||'📦'
      })).filter(x=>isUuid(x.id));
      if(mapped.length || STATE.favorites.length===0){
        STATE.favorites=mapped;
        saveToStorage(KEYS.FAVORITES,STATE.favorites);
        updateFavoritesBadge();
        if(typeof renderFavoritesPage==='function' && STATE.currentPage==='favorites') renderFavoritesPage();
      }
      return true;
    }catch(err){
      console.warn('Velora cloud wishlist sync:',err);
      return false;
    }
  }

  const originalOpenProductDetail=window.openProductDetail;
  window.openProductDetail=async function(productId){
    if(isUuid(productId)){
      const existing=MAHA_DATA.PRODUCTS.find(p=>p.id===productId);
      if(!existing){
        try{
          const {data,error}=await client.from('products')
            .select('*,product_images(image_url,alt_text,sort_order,is_primary),stores(id,name,slug),categories(id,name,slug)')
            .eq('id',productId).maybeSingle();
          if(!error && data){
            const canonical={
              ...data,
              id:data.id,
              name:data.name,
              price:Number(data.price||0),
              oldPrice:data.original_price!=null?Number(data.original_price):null,
              emoji:data.emoji||'📦',
              subcategory:data.subcategory||data.categories?.name||'',
              category:data.categories?.slug||data.category||'all',
              brand:data.brand||data.stores?.name||'Velora Seller',
              reviewsCount:Number(data.review_count||0),
              images:(data.product_images||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x=>x.image_url).filter(Boolean),
              canonicalId:data.id,
              sellerId:data.seller_id,
              storeId:data.store_id||data.stores?.id||null,
              storeName:data.stores?.name||''
            };
            MAHA_DATA.PRODUCTS=MAHA_DATA.PRODUCTS.filter(p=>p.id!==productId).concat([canonical]);
          }
        }catch(err){ console.warn('Velora product detail sync:',err); }
      }
    }
    return typeof originalOpenProductDetail==='function' ? originalOpenProductDetail.apply(this,arguments) : undefined;
  };

  async function persistPreferredCurrency(code){
    const value=String(code||'').toUpperCase();
    if(!/^[A-Z]{3}$/.test(value)) return;
    const user=await currentUser();
    if(!user) return;
    try{
      await client.from('profiles').update({preferred_currency:value,updated_at:new Date().toISOString()}).eq('id',user.id);
    }catch(err){ console.warn('Velora currency preference:',err); }
  }

  const select=document.getElementById('currencySelect');
  if(select){
    select.addEventListener('change',()=>persistPreferredCurrency(select.value));
  }

  async function bootCloudCommerce(){
    const user=await currentUser();
    if(!user) return;
    await syncCloudCartFromServer();
    await syncCloudWishlist();
  }

  window.veloraSyncCloudCart=syncCloudCartFromServer;
  window.veloraSyncCloudWishlist=syncCloudWishlist;
  window.veloraPersistPreferredCurrency=persistPreferredCurrency;

  client.auth.onAuthStateChange((event)=>{
    if(event==='SIGNED_IN' || event==='TOKEN_REFRESHED') setTimeout(bootCloudCommerce,100);
    if(event==='SIGNED_OUT'){
      if(typeof updateCartBadge==='function') updateCartBadge();
      if(typeof updateFavoritesBadge==='function') updateFavoritesBadge();
    }
  });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(bootCloudCommerce,250),{once:true});
  else setTimeout(bootCloudCommerce,250);
})();


/* ============================================================
   VELORA STAGE 7.4 — CLOUD CUSTOMER ORDERS
   ------------------------------------------------------------
   Customer order history prefers the canonical Supabase order
   graph, including split seller items and fulfillment status.
   ============================================================ */
(function(){
  'use strict';
  const client=window.mahaSupabase;
  if(!client) return;

  async function getUser(){
    try{ const {data}=await client.auth.getSession(); return data?.session?.user||null; }
    catch(_){ return null; }
  }

  async function loadCustomerOrders(){
    const user=await getUser();
    if(!user) return [];
    const {data,error}=await client.from('orders')
      .select('id,order_number,status,subtotal,shipping,total,currency,payment_status,created_at,order_items(id,product_id,product_name,quantity,unit_price,subtotal,seller_id,store_id,store_name),shipments(id,store_id,carrier_code,service_name,tracking_number,status,tracking_url,estimated_delivery_at)')
      .eq('customer_id',user.id)
      .order('created_at',{ascending:false});
    if(error){ console.warn('Velora customer orders:',error.message); return []; }
    return Array.isArray(data)?data:[];
  }

  function renderCanonicalOrders(orders){
    const container=document.getElementById('ordersContent');
    if(!container) return;
    if(!orders.length){
      container.innerHTML='<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>You haven\'t placed any orders.</p><button class="btn btn-primary btn-lg" onclick="navigateTo(\'shop\')">Shop Now</button></div>';
      return;
    }
    container.innerHTML=orders.map(order=>{
      const items=Array.isArray(order.order_items)?order.order_items:[];
      const shipments=Array.isArray(order.shipments)?order.shipments:[];
      return `<div class="form-section" style="margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;margin-bottom:1rem;">
          <div><div style="font-weight:900;color:var(--primary);">Order #${escapeHtml(String(order.order_number||''))}</div>
          <div style="font-size:.8rem;color:var(--text-muted);">${new Date(order.created_at).toLocaleString()}</div></div>
          <div style="padding:.3rem .8rem;background:rgba(76,175,80,.15);color:var(--success);border-radius:999px;font-size:.8rem;font-weight:700;">${escapeHtml(order.status||'pending')}</div>
        </div>
        <div style="display:grid;gap:.55rem;margin-bottom:.9rem;">${items.map(i=>`<div style="display:flex;justify-content:space-between;gap:1rem;"><span>${escapeHtml(i.product_name||'Product')} × ${Number(i.quantity||0)}</span><span>${formatPrice(i.subtotal||0,order.currency)}</span></div>`).join('')}</div>
        ${shipments.length?`<div style="padding:.8rem;background:var(--bg-alt);border-radius:12px;margin-bottom:.9rem;"><strong>🚚 Fulfillment</strong>${shipments.map(sh=>`<div style="font-size:.85rem;margin-top:.35rem;">${escapeHtml(sh.store_id?'Seller shipment':'Shipment')} · ${escapeHtml(sh.carrier_code||'Carrier pending')} · ${escapeHtml(sh.status||'label_created')} ${sh.tracking_number?`· ${escapeHtml(sh.tracking_number)}`:''}</div>`).join('')}</div>`:''}
        <div style="display:flex;justify-content:space-between;"><span>Payment: ${escapeHtml(order.payment_status||'pending')}</span><strong style="color:var(--primary);">${formatPrice(order.total||0,order.currency)}</strong></div>
      </div>`;
    }).join('');
  }

  window.veloraLoadCustomerOrders=loadCustomerOrders;

  const originalRenderOrdersPage=window.renderOrdersPage;
  window.renderOrdersPage=async function(){
    const container=document.getElementById('ordersContent');
    if(!container || !window.STATE?.user){
      return typeof originalRenderOrdersPage==='function' ? originalRenderOrdersPage.apply(this,arguments) : undefined;
    }
    container.innerHTML='<div class="empty-state"><div class="empty-icon">⏳</div><h3>Loading your orders</h3><p>Syncing your Velora order history…</p></div>';
    const orders=await loadCustomerOrders();
    if(orders.length){ renderCanonicalOrders(orders); return; }
    if(typeof originalRenderOrdersPage==='function') return originalRenderOrdersPage.apply(this,arguments);
  };

  client.auth.onAuthStateChange((event)=>{
    if(event==='SIGNED_IN' && STATE.currentPage==='orders') setTimeout(()=>window.renderOrdersPage(),150);
  });
})();
