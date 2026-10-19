'use strict';
// Static layout + balance configuration. Positions are in logical pixels. The restaurant occupies
// (0..960, 98..646); the world extends beyond it so the player can wander outside.
const CFG = {
  W: 960, H: 640,                                   // reference viewport used for zoom rules
  WORLD: { x0: -1020, y0: -170, x1: 1520, y1: 1180 }, // walkable world bounds (the whole tiny town, farm included)
  BUILDING: { x0: 0, y0: 98, x1: 966, y1: 646 },    // outer wall rectangle
  DOOR: { y0: 572, y1: 638 },                        // gap in the right wall
  SAVE_KEY: 'pizza-rush-save-v1',

  PLAYER_START: { x: 540, y: 430 }, // open floor in front of the counter, away from every circle
  ENTRANCE: { x: 925, y: 605 },          // just inside the door
  DOOR_OUT: { x: 1000, y: 605 },         // just outside the door
  SPAWN_OUT: { x: 1575, y: 605 },        // customers appear / vanish here: just past the east edge, off camera

  // Kitchen
  OVENS: [{ x: 90, y: 250 }, { x: 90, y: 350 }],
  OVEN_PILE: { x: 190, y: 300 },
  OVEN_PILE_STAND: { x: 190, y: 350 },
  PREP_TABLE: { x: 255, y: 205, w: 76, h: 38 },   // make a pizza by hand here
  HANDMADE_PIZZAS: 3,                               // a handmade family-size pie counts as three

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

  // Roads: the top street (drive-thru) plus a loop around the block. Buildings sit across the loop.
  ROAD: { y1: 18, y2: 98 },
  ROADS: [
    { x0: -1020, y0: 18, x1: 1520, y1: 98 },     // Main Street (top)
    { x0: 1240, y0: 18, x1: 1320, y1: 1000 },    // East Road
    { x0: -1020, y0: 920, x1: 1320, y1: 1000 },  // South Road
    { x0: -480, y0: 18, x1: -400, y1: 1000 },    // West Road
  ],
  // Other buildings in town (solid rectangles; doors face a road)
  ICE_CREAM: {
    rect: { x0: 1020, y0: 112, x1: 1222, y1: 318 },  // next door, above the parking lot
    door: { x: 1120, y: 318 }, doorW: 60,
    inside: { x: 1120, y: 250 },                      // where customers stand to order
    counter: { x: 1120, y: 200 },
    cash: { x: 1060, y: 160 },
    scooper: { x: 1120, y: 165 },
    buyPad: { x: 1120, y: 360 }, price: 900,
    flavorsPad: { x: 1180, y: 250 },
    flavorsBase: 120, flavorsGrowth: 1.5, flavorsMax: 5,
    price: 8, spawnBase: 7,
  },
  HOUSES: [
    { x0: -300, y0: 1020, x1: -120, y1: 1160, door: { x: -210, y: 1020 }, color: '#f2d6a0', roof: '#b23a48', name: 'Blue Door House' },
    { x0: 80, y0: 1020, x1: 260, y1: 1160, door: { x: 170, y: 1020 }, color: '#cfe3f7', roof: '#2d5a8a', name: 'River House' },
    { x0: 520, y0: 1020, x1: 700, y1: 1160, door: { x: 610, y: 1020 }, color: '#e8f2cf', roof: '#5a8a2d', name: 'Green House' },
    { x0: 960, y0: 1020, x1: 1140, y1: 1160, door: { x: 1050, y: 1020 }, color: '#f7e0cf', roof: '#8a5a2d', name: 'Corner House' },
  ],
  FIRE_STATION: { x0: 1340, y0: 300, x1: 1520, y1: 540, door: { x: 1340, y: 440 } },
  FIRE_TRUCK_HOME: { x: 1400, y: 460 },                 // parked inside the lower garage bay
  // The fire truck's outing: out of the bay, around the block, into the drive-thru line, then home.
  FIRE_TRUCK_OUT: [{ x: 1280, y: 460 }, { x: 1280, y: 960 }, { x: -440, y: 960 }, { x: -440, y: 58 }],
  FIRE_TRUCK_BACK: [{ x: 1280, y: 58 }, { x: 1280, y: 460 }, { x: 1400, y: 460 }],
  FIRE_TRUCK_EVERY: [240, 420],                         // seconds between outings (first one sooner)
  FIRE_TRUCK_FIRST: [80, 140],
  // Drive-thru vehicles: a plain car most of the time, something fun now and then
  FUN_CAR_CHANCE: 0.14,
  FUN_CARS: ['mixer', 'police', 'schoolbus', 'taxi', 'tractor'],
  // The farm, west of West Road: pick ingredients for handmade pizzas
  FARM: {
    x0: -1000, y0: 120, x1: -500, y1: 900,
    barn: { x0: -980, y0: 150, x1: -800, y1: 300 },
    silo: { x: -770, y: 225 },
    pen: { x0: -740, y0: 150, x1: -520, y1: 300 },
    cowHome: { x: -630, y: 235 },
    gate: { x: -500, y: 420 },
    tractor: { x: -600, y: 760 },
    plots: [
      { kind: 'tomato', x: -940, y: 370 }, { kind: 'tomato', x: -890, y: 370 }, { kind: 'tomato', x: -840, y: 370 },
      { kind: 'tomato', x: -940, y: 440 }, { kind: 'tomato', x: -890, y: 440 }, { kind: 'tomato', x: -840, y: 440 },
      { kind: 'wheat', x: -740, y: 370 }, { kind: 'wheat', x: -690, y: 370 }, { kind: 'wheat', x: -640, y: 370 }, { kind: 'wheat', x: -590, y: 370 },
      { kind: 'wheat', x: -740, y: 440 }, { kind: 'wheat', x: -690, y: 440 }, { kind: 'wheat', x: -640, y: 440 }, { kind: 'wheat', x: -590, y: 440 },
      { kind: 'basil', x: -940, y: 570 }, { kind: 'basil', x: -890, y: 570 }, { kind: 'basil', x: -840, y: 570 }, { kind: 'basil', x: -915, y: 630 }, { kind: 'basil', x: -865, y: 630 },
      { kind: 'mushroom', x: -740, y: 580 }, { kind: 'mushroom', x: -680, y: 580 }, { kind: 'mushroom', x: -620, y: 580 }, { kind: 'mushroom', x: -710, y: 640 }, { kind: 'mushroom', x: -650, y: 640 },
    ],
    regrow: { tomato: 40, wheat: 45, basil: 35, mushroom: 45, cheese: 30 },
    max: 9,
  },
  INGREDIENTS: { wheat: '🌾', tomato: '🍅', cheese: '🧀', mushroom: '🍄', basil: '🌿' },

  // Train station north of the farm: tracks run along the top of the world
  STATION: {
    trackY: -140, platform: { x0: -900, y0: -118, x1: -560, y1: -72 },
    house: { x0: -890, y0: -118, x1: -790, y1: -72 },
    stopX: -700,                            // where the locomotive's front stops
    first: [50, 80], every: [180, 300],     // seconds until the first / next train
    dwell: 9, passengers: [5, 8],
    // passengers walk along the far sidewalk, down the shop's side path, and in through the door
    route: [{ x: -700, y: -30 }, { x: 990, y: -30 }, { x: 990, y: 560 }],
    overflow: { x: 990, y: 520, dy: -44 },  // where extra customers queue outside the door
  },
  // Playground south of the farm across South Road
  PLAYGROUND: {
    x0: -1000, y0: 1015, x1: -500, y1: 1170,
    rides: [
      { kind: 'slide', x: -960, y: 1060 },     // ladder base at (x, y+36); slide runs to the right
      { kind: 'spring', x: -790, y: 1080 },
      { kind: 'seesaw', x: -700, y: 1145 },
      { kind: 'swing', x: -590, y: 1045 },     // two seats at x-24 and x+24
    ],
  },

  // Pizza delivery
  DELIVERY_CAR: { x: 1116, y: 596 },   // parked in the shop's lot
  DELIVERY_BIKE: { x: 990, y: 520 },   // scooter on the sidewalk by the door
  VEHICLES: {
    car:  { speed: 360, radius: 22, label: '🚗 Drive', exit: '🚶 Get out' },
    bike: { speed: 440, radius: 13, label: '🛵 Ride', exit: '🚶 Hop off' },
  },
  DELIVERY_SPEED: 360,
  DELIVERY_TIP: 2.0,                   // delivered pizzas pay double
  ORDER_EVERY: [25, 45],               // seconds between new house orders
  ORDER_MAX: 2,
  ORDER_WAIT: 120,
  DT_WINDOW: { x: 640, y: 58 },
  DT_SLOT_DX: 118,
  DT_SLOTS: 4,
  DT_STACK: { x: 600, y: 128 },
  DT_STACK_STAND: { x: 600, y: 168 },
  DT_STACK_CAP: 10,
  DT_CASH: { x: 705, y: 128 },

  // Buy pads: stand still on one to pour money in. Each sits where it makes sense in the shop.
  SHOP_PADS: [
    { key: 'speed',    kind: 'upgrade', pos: { x: 300, y: 290 } },   // kitchen, right side
    { key: 'capacity', kind: 'upgrade', pos: { x: 300, y: 400 } },   // kitchen, right side
    { key: 'oven',     kind: 'upgrade', pos: { x: 90,  y: 432 } },   // below the ovens
    { key: 'cashier',  kind: 'staff',   pos: { x: 60,  y: 535 } },   // office desk: hire once, then train
    { key: 'helper',   kind: 'staff',   pos: { x: 170, y: 535 } },
    { key: 'cleaner',  kind: 'staff',   pos: { x: 280, y: 535 } },   // appears once there are tables
  ],
  OFFICE_DESK: { x: 170, y: 612 },
  PAD_DWELL: 0.45, // seconds standing still on a pad before money starts flowing

  // Decorations: grayed-out items shown where they will appear; stand on one to buy it.
  DECOR_ITEMS: [
    { key: 'plants',     label: 'Plants',        ico: '🪴', price: 50,  spot: { x: 662, y: 560 } },
    { key: 'posters',    label: 'Posters',       ico: '🖼️', price: 80,  spot: { x: 100, y: 168 } },
    { key: 'lights',     label: 'String Lights', ico: '💡', price: 120, spot: { x: 335, y: 150 } },
    { key: 'neon',       label: 'Neon Sign',     ico: '💗', price: 180, spot: { x: 820, y: 240 } },
    { key: 'jukebox',    label: 'Jukebox & Rug', ico: '🎵', price: 260, spot: { x: 918, y: 262 } },
  ],

  // Unlockable areas.
  PADS: [
    { key: 'dining', label: 'Tables', ico: '🍽️', price: 180, pos: { x: 790, y: 465 }, req: [] },
    { key: 'oven2', label: '2nd Oven', ico: '🔥', price: 280, pos: { x: 90, y: 350 }, req: [] },
    { key: 'tables2', label: 'More Tables', ico: '🍽️', price: 450, pos: { x: 790, y: 465 }, req: ['dining'] },
    { key: 'driveThru', label: 'Drive-Thru', ico: '🚗', price: 650, pos: { x: 880, y: 170 }, req: [] },
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
    helper:  { name: 'Helper',  ico: '👨‍🍳', hire: [160], upBase: 110, upGrowth: 1.5, upMax: 6, desc: 'Carries pizzas from the oven' },
    cleaner: { name: 'Cleaner', ico: '🧹', hire: [110], upBase: 70, upGrowth: 1.5, upMax: 3, desc: 'Cleans the tables', needs: 'dining' },
  },

  // Outside: coins to collect (respawn), trees, parked cars, fountain, pond, dog
  COINS: [
    { x: -180, y: 380 }, { x: -90, y: 480 }, { x: -200, y: 700 }, { x: -60, y: 760 },
    { x: 250, y: 740 }, { x: 620, y: 760 }, { x: 880, y: 730 },
    { x: 1150, y: 480 }, { x: 1060, y: 740 },
    { x: 150, y: -90 }, { x: 560, y: -110 }, { x: 980, y: -70 },
    { x: -520, y: 500 }, { x: 400, y: 1100 }, { x: 1420, y: 700 }, { x: 1440, y: 150 }, { x: -200, y: 860 }, { x: -600, y: 700 }, { x: -950, y: 800 },
  ],
  COIN_RESPAWN: 60,
  TREES: [
    { x: -200, y: 230, s: 1.1 }, { x: -90, y: 300, s: 0.9 }, { x: -215, y: 560, s: 1 }, { x: -120, y: 790, s: 1.05 },
    { x: 60, y: -50, s: 0.9 }, { x: 330, y: -60, s: 0.85 }, { x: 760, y: -55, s: 0.95 }, { x: 1120, y: -60, s: 0.9 },
    { x: 80, y: 780, s: 1 }, { x: 760, y: 790, s: 0.95 }, { x: 1010, y: 800, s: 0.9 },
    { x: -520, y: 300, s: 1 }, { x: -530, y: 760, s: 0.9 }, { x: -340, y: 880, s: 0.8 }, { x: -980, y: 700, s: 1.1 }, { x: -800, y: 850, s: 0.9 }, { x: -980, y: -40, s: 0.9 }, { x: -500, y: -40, s: 0.85 }, { x: -470, y: 1130, s: 1 },
    { x: 1420, y: 230, s: 1 }, { x: 1460, y: 650, s: 1.1 }, { x: 1380, y: 860, s: 0.9 },
    { x: -40, y: 1120, s: 0.9 }, { x: 400, y: 1140, s: 1 }, { x: 840, y: 1130, s: 0.9 }, { x: 1300, y: 1120, s: 1 },
  ],
  POND: { x: -150, y: 460, rx: 70, ry: 42 },
  FOUNTAIN: { x: 450, y: 745 },
  PARKING: { x0: 1012, y0: 330, x1: 1220, y1: 646 },
  DOG_HOME: { x: -120, y: 640 },

  // Timing
  BAKE_TIME: 2.4,
  CHECKOUT_TIME: 1.6,
  EAT_TIME: 6,
  TIP_RATE: 0.5, // diners leave half their bill on the table as a tip
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
