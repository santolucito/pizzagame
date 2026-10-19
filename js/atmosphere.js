'use strict';
// Day/night dusk cycle, rain in town, snow at Construction Town.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
const AtmosphereExt = {
  name: 'atmosphere',
};
Game.ext.push(AtmosphereExt);
Render.ext.push(AtmosphereExt);
