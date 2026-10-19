'use strict';
// The secret path behind the barn to a cabin with a sleeping bear.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
const SecretExt = {
  name: 'secret',
};
Game.ext.push(SecretExt);
Render.ext.push(SecretExt);
