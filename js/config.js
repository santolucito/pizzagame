'use strict';
// Static layout + balance configuration. Positions are in logical pixels. The restaurant occupies
// (0..960, 98..646); the world extends beyond it so the player can wander outside.
const CFG = {
  W: 960, H: 640,                                   // reference viewport used for zoom rules
  WORLD: { x0: -260, y0: -170, x1: 1220, y1: 820 }, // walkable world bounds
  BUILDING: { x0: 0, y0: 98, x1: 966, y1: 646 },    // outer wall rectangle
  DOOR: { y0: 572, y1: 638 },                        // gap in the right wall
  SAVE_KEY: 'pizza-rush-save-v1',

  PLAYER_START: { x: 300, y: 420 },
  ENTRANCE: { x: 925, y: 605 },          // just inside the door
  DOOR_OUT: { x: 1000, y: 605 },         // just outside the door
  SPAWN_OUT: { x: 1215, y: 605 },        // customers appear / vanish here

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

  // Drive-thru (road strip along the top of the building, spanning the whole world)
  ROAD: { y1: 18, y2: 98 },
  DT_WINDOW: { x: 640, y: 58 },
  DT_SLOT_DX: 118,
  DT_SLOTS: 4,
  DT_STACK: { x: 600, y: 128 },
  DT_STACK_STAND: { x: 600, y: 168 },
  DT_STACK_CAP: 10,
  DT_CASH: { x: 705, y: 128 },

  // Buy pads: stand still on one to pour money in. Each sits where it makes sense in the shop.
  SHOP_PADS: [
    { key: 'speed',    kind: 'upgrade', pos: { x: 70,  y: 540 } },   // office corner
    { key: 'capacity', kind: 'upgrade', pos: { x: 250, y: 540 } },   // office corner
    { key: 'oven',     kind: 'upgrade', pos: { x: 90,  y: 432 } },   // below the ovens
    { key: 'helper',   kind: 'staff',   pos: { x: 300, y: 300 } },   // kitchen, by the pizza tray
    { key: 'cashier',  kind: 'staff',   pos: { x: 760, y: 180 } },   // behind the counter, by the register
    { key: 'cleaner',  kind: 'staff',   pos: { x: 920, y: 460 } },   // dining area (needs tables)
  ],
  PAD_DWELL: 0.45, // seconds standing still on a pad before money starts flowing

  // Decorations: grayed-out items shown where they will appear; stand on one to buy it.
  DECOR_ITEMS: [
    { key: 'plants',     label: 'Plants',        ico: '🪴', price: 50,  spot: { x: 662, y: 560 } },
    { key: 'posters',    label: 'Posters',       ico: '🖼️', price: 80,  spot: { x: 100, y: 168 } },
    { key: 'lights',     label: 'String Lights', ico: '💡', price: 120, spot: { x: 250, y: 168 } },
    { key: 'neon',       label: 'Neon Sign',     ico: '💗', price: 180, spot: { x: 760, y: 178 } },
    { key: 'jukebox',    label: 'Jukebox & Rug', ico: '🎵', price: 260, spot: { x: 918, y: 262 } },
    { key: 'chandelier', label: 'Chandelier',    ico: '✨', price: 400, spot: { x: 790, y: 300 } },
  ],

  // Unlockable areas.
  PADS: [
    { key: 'dining', label: 'Tables', ico: '🍽️', price: 180, pos: { x: 790, y: 465 }, req: [] },
    { key: 'oven2', label: '2nd Oven', ico: '🔥', price: 280, pos: { x: 90, y: 350 }, req: [] },
    { key: 'tables2', label: 'More Tables', ico: '🍽️', price: 450, pos: { x: 790, y: 465 }, req: ['dining'] },
    { key: 'driveThru', label: 'Drive-Thru', ico: '🚗', price: 650, pos: { x: 880, y: 170 }, req: ['dining'] },
  ],
  PAD_RADIUS: 40,

  // Economy
  PIZZA_PRICE: 8,
  DT_PRICE_MULT: 1.5,
  SHOP_NAME: 'Naples Street Pizza',

  // Simplified upgrades: three things, each does one obvious thing.
  UPGRADES: {
    speed:    { name: 'Speed',       ico: '👟', base: 35, growth: 1.45, max: 8,  desc: 'Run faster' },
    capacity: { name: 'Carry More',  ico: '📦', base: 45, growth: 1.5,  max: 8,  desc: 'Carry a bigger pizza stack' },
    oven:     { name: 'Better Oven', ico: '🔥', base: 50, growth: 1.5,  max: 10, desc: 'Bakes faster and holds more' },
  },

  // Staff: the pad hires first, then trains.
  STAFF: {
    cashier: { name: 'Cashier', ico: '🧑‍💼', hire: [140], upBase: 90, upGrowth: 1.5, upMax: 5, desc: 'Takes the money at the register' },
    helper:  { name: 'Helper',  ico: '👨‍🍳', hire: [160, 350, 700], upBase: 110, upGrowth: 1.5, upMax: 5, desc: 'Carries pizzas from the oven' },
    cleaner: { name: 'Cleaner', ico: '🧹', hire: [110], upBase: 70, upGrowth: 1.5, upMax: 3, desc: 'Cleans the tables', needs: 'dining' },
  },

  // Outside: coins to collect (respawn), trees, parked cars, fountain, pond, dog
  COINS: [
    { x: -180, y: 380 }, { x: -90, y: 480 }, { x: -200, y: 700 }, { x: -60, y: 760 },
    { x: 250, y: 740 }, { x: 620, y: 760 }, { x: 880, y: 730 },
    { x: 1080, y: 230 }, { x: 1150, y: 480 }, { x: 1060, y: 740 },
    { x: 150, y: -90 }, { x: 560, y: -110 }, { x: 980, y: -70 },
  ],
  COIN_RESPAWN: 60,
  TREES: [
    { x: -200, y: 230, s: 1.1 }, { x: -90, y: 300, s: 0.9 }, { x: -215, y: 560, s: 1 }, { x: -120, y: 790, s: 1.05 },
    { x: 60, y: -120, s: 1 }, { x: 330, y: -140, s: 0.9 }, { x: 760, y: -125, s: 1.1 }, { x: 1120, y: -130, s: 0.95 },
    { x: 1090, y: 170, s: 1 }, { x: 1190, y: 280, s: 0.85 },
    { x: 80, y: 780, s: 1 }, { x: 760, y: 790, s: 0.95 }, { x: 1010, y: 800, s: 0.9 },
  ],
  POND: { x: -150, y: 460, rx: 70, ry: 42 },
  FOUNTAIN: { x: 450, y: 745 },
  PARKING: { x0: 1012, y0: 330, x1: 1220, y1: 646 },
  DOG_HOME: { x: -120, y: 640 },

  // Timing
  BAKE_TIME: 2.4,
  CHECKOUT_TIME: 1.6,
  EAT_TIME: 6,
  CLEAN_TIME: 1.3,
  PATIENCE: 60,
  CAR_PATIENCE: 55,
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
