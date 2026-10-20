const fs = require('fs');
const path = require('path');

const prodsDir = 'c:/Users/DELL/Downloads/COSMOS/assets/products';
if (!fs.existsSync(prodsDir)) fs.mkdirSync(prodsDir, { recursive: true });

function makeProductSvg({ name, category, subtitle, primaryColor, secondaryColor, accentColor, iconSvg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${secondaryColor}"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${secondaryColor}"/>
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="${accentColor}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${primaryColor}" flood-opacity="0.18"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="600" height="700" fill="url(#bgGrad)"/>
  
  <!-- Subtle Aesthetic Geometric Rings -->
  <circle cx="300" cy="310" r="180" fill="none" stroke="${primaryColor}" stroke-width="1.5" stroke-opacity="0.15"/>
  <circle cx="300" cy="310" r="140" fill="none" stroke="${primaryColor}" stroke-width="1" stroke-dasharray="6,6" stroke-opacity="0.2"/>

  <!-- Category Tag -->
  <g transform="translate(40, 50)">
    <rect width="110" height="32" rx="16" fill="${primaryColor}" fill-opacity="0.12"/>
    <text x="55" y="21" font-family="'Poppins', sans-serif" font-size="12" font-weight="700" fill="${primaryColor}" letter-spacing="1.5" text-anchor="middle" text-transform="uppercase">${category}</text>
  </g>

  <!-- Central Card & Vector Artwork -->
  <g filter="url(#shadow)" transform="translate(100, 120)">
    <rect width="400" height="380" rx="28" fill="#ffffff" fill-opacity="0.85"/>
    <g transform="translate(200, 190)">
      ${iconSvg}
    </g>
  </g>

  <!-- Typography -->
  <text x="300" y="555" font-family="'Poppins', sans-serif" font-size="25" font-weight="800" fill="#0f172a" text-anchor="middle" letter-spacing="-0.5">${name}</text>
  <text x="300" y="585" font-family="'Poppins', sans-serif" font-size="14" font-weight="500" fill="#64748b" text-anchor="middle">${subtitle}</text>
  
  <!-- Quality Emblem -->
  <g transform="translate(300, 630)">
    <rect x="-90" y="-16" width="180" height="32" rx="16" fill="url(#primaryGrad)"/>
    <text x="0" y="5" font-family="'Poppins', sans-serif" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">✨ COSMOS LUXURY</text>
  </g>
</svg>`;
}

const products = [
  {
    key: 'denim-jacket',
    name: 'Denim Jacket',
    category: 'Clothes',
    subtitle: 'Classic Distressed Vintage Wash',
    primaryColor: '#2563eb',
    secondaryColor: '#eff6ff',
    accentColor: '#1d4ed8',
    iconSvg: `<path d="M-60,-90 L-110,-40 L-80,0 L-50,-20 L-50,80 L50,80 L50,-20 L80,0 L110,-40 L60,-90 L25,-70 C15,-55 -15,-55 -25,-70 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="4"/>
    <line x1="0" y1="-55" x2="0" y2="80" stroke="#1d4ed8" stroke-width="3" stroke-dasharray="4,4"/>
    <circle cx="0" y="-30" r="4" fill="#fbbf24"/>
    <circle cx="0" y="0" r="4" fill="#fbbf24"/>
    <circle cx="0" y="30" r="4" fill="#fbbf24"/>
    <circle cx="0" y="60" r="4" fill="#fbbf24"/>
    <rect x="-35" y="-10" width="22" height="22" rx="3" fill="none" stroke="#1d4ed8" stroke-width="2"/>
    <rect x="13" y="-10" width="22" height="22" rx="3" fill="none" stroke="#1d4ed8" stroke-width="2"/>`
  },
  {
    key: 'embroidered-kurti',
    name: 'Embroidered Kurti',
    category: 'Clothes',
    subtitle: 'Floral Handwork Festive Ethnic',
    primaryColor: '#db2777',
    secondaryColor: '#fdf2f8',
    accentColor: '#9d174d',
    iconSvg: `<path d="M-45,-90 L-85,-40 L-65,-15 L-40,-30 L-55,90 L55,90 L40,-30 L65,-15 L85,-40 L45,-90 C25,-65 -25,-65 -45,-90 Z" fill="#ec4899" stroke="#be185d" stroke-width="4"/>
    <path d="M0,-65 L0,20" stroke="#fef08a" stroke-width="4"/>
    <circle cx="0" y="-45" r="5" fill="#fef08a"/>
    <circle cx="0" y="-20" r="5" fill="#fef08a"/>
    <circle cx="0" y="5" r="5" fill="#fef08a"/>
    <path d="M-25,90 L-35,60 L-15,60 Z M15,60 L25,90 L35,60 Z" fill="#fef08a"/>`
  },
  {
    key: 'hydra-glow-serum',
    name: 'Hydra Glow Serum',
    category: 'Beauty',
    subtitle: '10% Hyaluronic & Niacinamide',
    primaryColor: '#06b6d4',
    secondaryColor: '#ecfeff',
    accentColor: '#0891b2',
    iconSvg: `<rect x="-30" y="-40" width="60" height="110" rx="14" fill="#22d3ee" stroke="#0891b2" stroke-width="4"/>
    <rect x="-16" y="-75" width="32" height="35" rx="6" fill="#ffffff" stroke="#0891b2" stroke-width="3"/>
    <path d="M-8,-75 C-8,-95 8,-95 8,-75 Z" fill="#67e8f9" stroke="#0891b2" stroke-width="3"/>
    <rect x="-20" y="-15" width="40" height="50" rx="4" fill="#ffffff" opacity="0.9"/>
    <line x1="-12" y1="-2" x2="12" y2="-2" stroke="#0891b2" stroke-width="3"/>
    <line x1="-12" y1="12" x2="5" y2="12" stroke="#0891b2" stroke-width="2"/>
    <circle cx="0" y="50" r="4" fill="#ffffff"/>`
  },
  {
    key: 'matte-lipstick-set',
    name: 'Matte Lipstick Set',
    category: 'Beauty',
    subtitle: 'Long-Wear Velvet Trio',
    primaryColor: '#e11d48',
    secondaryColor: '#fff1f2',
    accentColor: '#9f1239',
    iconSvg: `<rect x="-22" y="0" width="44" height="85" rx="6" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
    <rect x="-18" y="-20" width="36" height="20" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
    <path d="M-16,-20 L-16,-60 C-16,-85 16,-65 16,-60 L16,-20 Z" fill="#e11d48" stroke="#be123c" stroke-width="3"/>
    <rect x="-24" y="25" width="48" height="6" fill="#f59e0b"/>`
  },
  {
    key: 'rose-clay-mask',
    name: 'Rose Clay Face Mask',
    category: 'Beauty',
    subtitle: 'Detoxifying Organic Clay',
    primaryColor: '#f43f5e',
    secondaryColor: '#fff1f2',
    accentColor: '#be123c',
    iconSvg: `<ellipse cx="0" cy="55" rx="55" ry="25" fill="#f43f5e" opacity="0.4"/>
    <path d="M-50,0 C-50,55 50,55 50,0 Z" fill="#fda4af" stroke="#f43f5e" stroke-width="4"/>
    <ellipse cx="0" cy="0" rx="50" ry="18" fill="#ffe4e6" stroke="#f43f5e" stroke-width="3"/>
    <ellipse cx="0" cy="-10" rx="54" ry="18" fill="#e11d48" stroke="#be123c" stroke-width="3"/>
    <rect x="-42" y="10" width="84" height="25" rx="4" fill="#ffffff" opacity="0.9"/>
    <text x="0" y="27" font-family="'Poppins', sans-serif" font-size="10" font-weight="700" fill="#e11d48" text-anchor="middle">ROSE CLAY</text>`
  },
  {
    key: 'satin-slip-skirt',
    name: 'Satin Slip Skirt',
    category: 'Clothes',
    subtitle: 'Bias-Cut Liquid Satin Midi',
    primaryColor: '#8b5cf6',
    secondaryColor: '#f5f3ff',
    accentColor: '#6d28d9',
    iconSvg: `<path d="M-30,-75 L30,-75 L55,80 C20,90 -20,90 -55,80 Z" fill="#c4b5fd" stroke="#7c3aed" stroke-width="4"/>
    <path d="M-30,-75 C-10,-70 10,-70 30,-75 L30,-65 C10,-60 -10,-60 -30,-65 Z" fill="#7c3aed"/>
    <path d="M-15,-40 Q5,20 15,80" stroke="#ede9fe" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`
  },
  {
    key: 'kajal-duo',
    name: 'Everyday Kajal Duo',
    category: 'Beauty',
    subtitle: 'Smudge-Proof Kohl Pencil Duo',
    primaryColor: '#0f172a',
    secondaryColor: '#f8fafc',
    accentColor: '#334155',
    iconSvg: `<g transform="rotate(-20)">
      <rect x="-24" y="-80" width="16" height="150" rx="8" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
      <path d="M-24,-80 L-16,-105 L-8,-80 Z" fill="#0f172a"/>
    </g>
    <g transform="rotate(15)">
      <rect x="8" y="-70" width="16" height="150" rx="8" fill="#db2777" stroke="#9d174d" stroke-width="3"/>
      <path d="M8,-70 L16,-95 L24,-70 Z" fill="#9d174d"/>
    </g>`
  },
  {
    key: 'crossbody-purse',
    name: 'Crossbody Purse',
    category: 'Fashion',
    subtitle: 'Quilted Leather Gold Chain',
    primaryColor: '#b45309',
    secondaryColor: '#fef3c7',
    accentColor: '#78350f',
    iconSvg: `<path d="M-60,10 C-60,-20 60,-20 60,10 L55,75 C55,85 -55,85 -55,75 Z" fill="#d97706" stroke="#b45309" stroke-width="4"/>
    <path d="M-55,-10 L0,30 L55,-10" fill="none" stroke="#fef3c7" stroke-width="3"/>
    <circle cx="0" cy="30" r="8" fill="#fef08a" stroke="#b45309" stroke-width="2"/>
    <path d="M-40,-10 C-40,-75 40,-75 40,-10" fill="none" stroke="#f59e0b" stroke-width="4" stroke-dasharray="6,4"/>`
  },
  {
    key: 'stiletto-heels',
    name: 'Crystal Stiletto Heels',
    category: 'Fashion',
    subtitle: 'Pointed Toe Embellished Pumps',
    primaryColor: '#ec4899',
    secondaryColor: '#fdf2f8',
    accentColor: '#be185d',
    iconSvg: `<path d="M-75,45 C-50,45 -20,10 10,-30 L45,-30 C60,-30 65,-10 40,25 C15,45 -10,48 -50,50 Z" fill="#f472b6" stroke="#db2777" stroke-width="4"/>
    <path d="M40,-30 L40,60 L33,60 L33,-10 Z" fill="#be185d"/>
    <circle cx="-50" cy="30" r="4" fill="#fef08a"/>
    <circle cx="-35" cy="20" r="4" fill="#fef08a"/>
    <circle cx="-20" cy="5" r="4" fill="#fef08a"/>`
  },
  {
    key: 'uv-sunglasses',
    name: 'Oversized UV Sunglasses',
    category: 'Fashion',
    subtitle: '100% UV Protection Chic Frames',
    primaryColor: '#0f172a',
    secondaryColor: '#f1f5f9',
    accentColor: '#334155',
    iconSvg: `<g transform="translate(0, 10)">
      <rect x="-85" y="-30" width="70" height="55" rx="14" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
      <rect x="15" y="-30" width="70" height="55" rx="14" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
      <line x1="-15" y1="-10" x2="15" y2="-10" stroke="#f59e0b" stroke-width="5"/>
      <line x1="-85" y1="-15" x2="-105" y2="-25" stroke="#f59e0b" stroke-width="4"/>
      <line x1="85" y1="-15" x2="105" y2="-25" stroke="#f59e0b" stroke-width="4"/>
      <path d="M-70,-15 L-30,-15" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
      <path d="M30,-15 L70,-15" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
    </g>`
  },
  {
    key: 'velvet-clutch',
    name: 'Evening Velvet Clutch',
    category: 'Fashion',
    subtitle: 'Crystal Brooch Evening Bag',
    primaryColor: '#701a75',
    secondaryColor: '#fdf4ff',
    accentColor: '#4a044e',
    iconSvg: `<rect x="-70" y="-30" width="140" height="90" rx="12" fill="#86198f" stroke="#701a75" stroke-width="4"/>
    <path d="M-70,-30 L0,20 L70,-30 Z" fill="#a21caf" stroke="#701a75" stroke-width="3"/>
    <circle cx="0" cy="20" r="12" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
    <circle cx="0" cy="20" r="6" fill="#e11d48"/>`
  },
  {
    key: 'block-heel-sandals',
    name: 'Block Heel Sandals',
    category: 'Fashion',
    subtitle: 'Strappy Casual Comfort Heels',
    primaryColor: '#d97706',
    secondaryColor: '#fffbeb',
    accentColor: '#b45309',
    iconSvg: `<path d="M-60,40 C-30,40 10,25 45,-15 L60,-15 C70,10 40,45 -30,48 Z" fill="#fbbf24" stroke="#d97706" stroke-width="4"/>
    <rect x="35" y="-10" width="22" height="60" rx="4" fill="#b45309"/>
    <path d="M-50,40 C-40,10 -20,10 -10,42" fill="none" stroke="#d97706" stroke-width="4"/>
    <path d="M-20,30 C-10,0 10,0 20,30" fill="none" stroke="#d97706" stroke-width="4"/>`
  },
  {
    key: 'choker-necklace',
    name: 'Layered Choker Necklace',
    category: 'Jewellery',
    subtitle: '18K Gold Plated Triple Chain',
    primaryColor: '#ca8a04',
    secondaryColor: '#fefce8',
    accentColor: '#854d0e',
    iconSvg: `<path d="M-60,-50 C-60,30 60,30 60,-50" fill="none" stroke="#eab308" stroke-width="4"/>
    <path d="M-70,-50 C-70,60 70,60 70,-50" fill="none" stroke="#facc15" stroke-width="3" stroke-dasharray="6,4"/>
    <path d="M-80,-50 C-80,90 80,90 80,-50" fill="none" stroke="#eab308" stroke-width="3"/>
    <circle cx="0" cy="30" r="8" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
    <polygon points="0,75 -8,90 8,90" fill="#facc15"/>`
  },
  {
    key: 'drop-earrings',
    name: 'Pearl Drop Earrings',
    category: 'Jewellery',
    subtitle: 'Freshwater Pearls & Gold Hooks',
    primaryColor: '#0284c7',
    secondaryColor: '#f0f9ff',
    accentColor: '#0369a1',
    iconSvg: `<g transform="translate(-30, 0)">
      <path d="M0,-60 C12,-60 12,-40 0,-30" fill="none" stroke="#eab308" stroke-width="3"/>
      <circle cx="0" cy="-20" r="6" fill="#eab308"/>
      <line x1="0" y1="-14" x2="0" y2="15" stroke="#eab308" stroke-width="2"/>
      <ellipse cx="0" cy="35" rx="14" ry="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    </g>
    <g transform="translate(30, 0)">
      <path d="M0,-60 C12,-60 12,-40 0,-30" fill="none" stroke="#eab308" stroke-width="3"/>
      <circle cx="0" cy="-20" r="6" fill="#eab308"/>
      <line x1="0" y1="-14" x2="0" y2="15" stroke="#eab308" stroke-width="2"/>
      <ellipse cx="0" cy="35" rx="14" ry="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    </g>`
  },
  {
    key: 'charm-bracelet',
    name: 'Crystal Charm Bracelet',
    category: 'Jewellery',
    subtitle: 'Silver Link Chain with Sparkling Charms',
    primaryColor: '#6366f1',
    secondaryColor: '#eef2ff',
    accentColor: '#4338ca',
    iconSvg: `<ellipse cx="0" cy="0" rx="70" ry="40" fill="none" stroke="#94a3b8" stroke-width="6" stroke-dasharray="10,6"/>
    <circle cx="-50" cy="25" r="10" fill="#a855f7" stroke="#7e22ce" stroke-width="2"/>
    <circle cx="0" cy="40" r="12" fill="#ec4899" stroke="#be185d" stroke-width="2"/>
    <circle cx="50" cy="25" r="10" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
    <polygon points="0,-40 -6,-52 6,-52" fill="#facc15"/>`
  },
  {
    key: 'gold-ring-set',
    name: 'Gold Ring Set (5 Pcs)',
    category: 'Jewellery',
    subtitle: 'Minimalist Stacking Bands',
    primaryColor: '#ca8a04',
    secondaryColor: '#fefce8',
    accentColor: '#a16207',
    iconSvg: `<ellipse cx="-35" cy="-20" rx="30" ry="18" fill="none" stroke="#facc15" stroke-width="6"/>
    <ellipse cx="35" cy="-20" rx="30" ry="18" fill="none" stroke="#facc15" stroke-width="6"/>
    <circle cx="35" cy="-38" r="8" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
    <ellipse cx="0" cy="30" rx="38" ry="20" fill="none" stroke="#eab308" stroke-width="8"/>`
  }
];

for (const p of products) {
  const svg = makeProductSvg(p);
  // Write .svg file
  fs.writeFileSync(path.join(prodsDir, `${p.key}.svg`), svg);
  // Also write .jpg named file with SVG content (safe for web browser img tags)
  fs.writeFileSync(path.join(prodsDir, `${p.key}.jpg`), svg);
}

console.log(`Successfully generated ${products.length} product images in assets/products/!`);
