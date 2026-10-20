'use strict';
// The pizzeria's roof, seen from outside, and the second floor with the owner's bedroom.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
const UpstairsExt = {
  name: 'upstairs',
};
Game.ext.push(UpstairsExt);
Render.ext.push(UpstairsExt);
