'use strict';
// Static layout + balance configuration. All positions are in logical canvas pixels (960x640).
const CFG = {
  W: 960, H: 640,
  SAVE_KEY: 'pizza-rush-save-v1',

  PLAYER_START: { x: 300, y: 420 },
  ENTRANCE: { x: 925, y: 605 },

  // Kitchen
  OVENS: [{ x: 90, y: 250 }, { x: 90, y: 350 }],
  OVEN_PILE: { x: 190, y: 300 },
  OVEN_PILE_STAND: { x: 190, y: 350 },

  // Counter
  COUNTER: { x1: 380, x2: 650, y: 212, h: 40 },
  DISPLAY: { x: 430, y: 232 },
  DISPLAY_STAND: { x: 430, y: 180 },
  DISPLAY_CAP: 15,
  REGISTER: { x: 590, y: 232 },
  CASHIER_SPOT: { x: 590, y: 180 },
  CASH_PILE: { x: 520, y: 170 },
  QUEUE: { x: 430, y: 304, dy: 46, max: 6 },
  PAY_QUEUE: { x: 590, y: 304, dx: 48, max: 4 },

  // Dining
  TABLES: [{ x: 720, y: 390 }, { x: 860, y: 390 }, { x: 720, y: 540 }, { x: 860, y: 540 }],
  CLEANER_HOME: { x: 900, y: 300 },

  // Drive-thru (road strip along the top of the map)
  ROAD: { y1: 18, y2: 98 },
  DT_WINDOW: { x: 640, y: 58 },
  DT_SLOT_DX: 118,
  DT_SLOTS: 4,
  DT_STACK: { x: 600, y: 128 },
  DT_STACK_STAND: { x: 600, y: 168 },
  DT_STACK_CAP: 10,
  DT_CASH: { x: 705, y: 128 },

  // Desks (open menus)
  UPG_PAD: { x: 120, y: 550 },
  HR_PAD: { x: 265, y: 550 },

  // Unlockable areas. Price is multiplied by the city cost multiplier.
  PADS: [
    { key: 'dining', label: 'Dining Area', price: 180, pos: { x: 790, y: 465 }, req: [] },
    { key: 'oven2', label: '2nd Oven', price: 280, pos: { x: 90, y: 350 }, req: [] },
    { key: 'tables2', label: 'More Tables', price: 450, pos: { x: 790, y: 465 }, req: ['dining'] },
    { key: 'driveThru', label: 'Drive-Thru', price: 650, pos: { x: 850, y: 165 }, req: ['dining'] },
    { key: 'franchise', label: 'Open Next City', price: 3500, pos: { x: 480, y: 560 }, req: ['tables2', 'oven2', 'driveThru'] },
  ],
  PAD_RADIUS: 40,

  // Economy
  PIZZA_PRICE: 8,
  DT_PRICE_MULT: 1.5,
  CITY_PRICE_GROWTH: 1.8,
  CITY_COST_GROWTH: 1.4,
  CITIES: ['Naples Street', 'Brooklyn', 'Chicago', 'Austin', 'Los Angeles', 'Tokyo', 'Rome', 'Sydney', 'Paris', 'Mars Colony'],

  // Player upgrades: {base cost, growth, max}
  UPGRADES: {
    speed:     { name: 'Move Speed',     ico: '👟', base: 35,  growth: 1.45, max: 8,  desc: 'Run faster around the shop' },
    capacity:  { name: 'Carry Capacity', ico: '📦', base: 45,  growth: 1.5, max: 8,  desc: '+50% carry capacity per level' },
    profit:    { name: 'Pizza Price',    ico: '💰', base: 70,  growth: 1.55, max: 10, desc: '+15% income per level' },
    ovenSpeed: { name: 'Oven Speed',     ico: '🔥', base: 55,  growth: 1.5, max: 10, desc: 'Bake pizzas faster' },
    ovenCap:   { name: 'Oven Storage',   ico: '🍕', base: 40,  growth: 1.45, max: 6,  desc: 'Bigger pile next to the oven' },
    marketing: { name: 'Marketing',      ico: '📣', base: 90,  growth: 1.55, max: 8,  desc: 'More customers, bigger orders' },
    decor:     { name: 'Decorations',    ico: '🪴', base: 50,  growth: 1.5,  max: 6,  desc: 'A prettier shop draws more (and more patient) customers' },
  },

  // What each Decorations level adds to the shop (purely cosmetic names shown in the panel)
  DECOR_LEVELS: ['Potted plants', 'Framed posters', 'String lights', 'Neon sign', 'Jukebox & rug', 'Chandelier & award'],

  // Staff
  STAFF: {
    cashier: { name: 'Cashier', ico: '🧑‍💼', hire: [140], upBase: 90, upGrowth: 1.5, upMax: 5, desc: 'Checks customers out at the register' },
    helper:  { name: 'Kitchen Helper', ico: '👨‍🍳', hire: [160, 350, 700], upBase: 110, upGrowth: 1.5, upMax: 5, desc: 'Carries pizzas from the oven to the counter' },
    cleaner: { name: 'Cleaner', ico: '🧹', hire: [110], upBase: 70, upGrowth: 1.5, upMax: 3, desc: 'Cleans dirty tables (needs Dining Area)', needs: 'dining' },
  },

  // Timing
  BAKE_TIME: 2.4,
  CHECKOUT_TIME: 1.6,
  EAT_TIME: 6,
  CLEAN_TIME: 1.3,
  PATIENCE: 45,
  CAR_PATIENCE: 50,
  SPAWN_BASE: 5.0,
  CAR_SPAWN_BASE: 7.5,
  XFER_DELAY: 0.11,
  OFFLINE_MAX_SEC: 3 * 3600,
  OFFLINE_EFFICIENCY: 0.5,
};

const COLORS = {
  shirts: ['#4e79a7', '#f28e2b', '#59a14f', '#b07aa1', '#ff9da7', '#76b7b2', '#edc948', '#9c755f', '#e15759'],
  skins: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'],
  cars: ['#d94f4f', '#3b7dd8', '#f2b134', '#41b883', '#8e5bd1', '#f06292', '#607d8b'],
};
