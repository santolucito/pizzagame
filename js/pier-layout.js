'use strict';
// Pizza Pier: a seaside amusement park at the end of subway Line 2 (Coney Island style). This file only holds the
// shared layout: the map's rectangle and the plot each part of the park owns, so the park's own files can be built side
// by side without overlapping. Everything is drawn and run by:
//   js/pizzapier.js    the map itself: sky, sea, beach, boardwalk, the open-air terminal station, the entrance arch,
//                      food stands, benches, lamps, the Ferris wheel and the ride that is still being built
//   js/pier-coaster.js the roller coaster        js/pier-bumper.js the bumper cars        js/pier-games.js the games
//   js/subway.js       Line 2 in the City station and the ride between the City and the pier ('pierline')
// North is up. The sea is along the bottom (south) edge, the beach above it, then the boardwalk running east-west the
// whole width of the map; the rides stand north of the boardwalk. The train comes in at the terminal on the west end.
CFG.PIER = {
  WORLD: { x0: 8000, y0: 5000, x1: 10400, y1: 6400, walkY0: 5110 },   // walkY0: the top band (sky/skyline) is not walkable
  SEA_Y: 6250,                                       // the water starts here (not walkable)
  BEACH: { y0: 6060, y1: 6250 },                     // sand (walkable)
  BOARDWALK: { y0: 5900, y1: 6060 },                 // planks, the main path along the whole park (keep it clear)
  // each plot is owned by one file; keep your art and obstacles inside your plot and leave a walkable way in from the
  // boardwalk (the plots' south edges face the boardwalk)
  PLOTS: {
    terminal: { x0: 8000, y0: 5110, x1: 8420, y1: 5900 },   // pizzapier.js: the Line 2 terminal (train enters from the west edge)
    coaster: { x0: 8460, y0: 5110, x1: 9440, y1: 5560 },    // pier-coaster.js
    bumper: { x0: 8460, y0: 5600, x1: 8960, y1: 5880 },     // pier-bumper.js
    games: { x0: 9000, y0: 5600, x1: 9660, y1: 5880 },      // pier-games.js (the midway: game booths)
    building: { x0: 9480, y0: 5110, x1: 10360, y1: 5560 },  // pizzapier.js: the ride still under construction
    wheel: { x0: 9700, y0: 5600, x1: 10360, y1: 5880 },     // pizzapier.js: the Ferris wheel (it may rise up over the plot above its base)
  },
  ARRIVE: { x: 8210, y: 5840 },                      // where the chef steps off the train at the terminal (pizzapier.js owns it)
};
CFG.AREAS.pizzapier = { WORLD: CFG.PIER.WORLD, noSky: true };
