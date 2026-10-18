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
    { key: 'dining', label: 'Dining Area', price: 300, pos: { x: 790, y: 465 }, req: [] },
    { key: 'oven2', label: '2nd Oven', price: 500, pos: { x: 90, y: 350 }, req: [] },
    { key: 'tables2', label: 'More Tables', price: 800, pos: { x: 790, y: 465 }, req: ['dining'] },
    { key: 'driveThru', label: 'Drive-Thru', price: 1200, pos: { x: 790, y: 135 }, req: ['dining'] },
    { key: 'franchise', label: 'Open Next City', price: 7000, pos: { x: 480, y: 560 }, req: ['tables2', 'oven2', 'driveThru'] },
  ],
  PAD_RADIUS: 40,

  // Economy
  PIZZA_PRICE: 6,
  DT_PRICE_MULT: 1.5,
  CITY_PRICE_GROWTH: 1.8,
  CITY_COST_GROWTH: 1.5,
  CITIES: ['Naples Street', 'Brooklyn', 'Chicago', 'Austin', 'Los Angeles', 'Tokyo', 'Rome', 'Sydney', 'Paris', 'Mars Colony'],

  // Player upgrades: {base cost, growth, max}
  UPGRADES: {
    speed:     { name: 'Move Speed',     ico: '👟', base: 60,  growth: 1.6, max: 8,  desc: 'Run faster around the shop' },
    capacity:  { name: 'Carry Capacity', ico: '📦', base: 80,  growth: 1.7, max: 8,  desc: 'Carry more pizzas at once' },
    profit:    { name: 'Pizza Price',    ico: '💰', base: 120, growth: 1.8, max: 10, desc: '+15% income per level' },
    ovenSpeed: { name: 'Oven Speed',     ico: '🔥', base: 100, growth: 1.7, max: 10, desc: 'Bake pizzas faster' },
    ovenCap:   { name: 'Oven Storage',   ico: '🍕', base: 70,  growth: 1.6, max: 6,  desc: 'Bigger pile next to the oven' },
    marketing: { name: 'Marketing',      ico: '📣', base: 150, growth: 1.8, max: 8,  desc: 'More customers, bigger orders' },
  },

  // Staff
  STAFF: {
    cashier: { name: 'Cashier', ico: '🧑‍💼', hire: [250], upBase: 150, upGrowth: 1.7, upMax: 5, desc: 'Checks customers out at the register' },
    helper:  { name: 'Kitchen Helper', ico: '👨‍🍳', hire: [300, 600, 1100], upBase: 200, upGrowth: 1.7, upMax: 5, desc: 'Carries pizzas from the oven to the counter' },
    cleaner: { name: 'Cleaner', ico: '🧹', hire: [200], upBase: 120, upGrowth: 1.6, upMax: 3, desc: 'Cleans dirty tables (needs Dining Area)', needs: 'dining' },
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
