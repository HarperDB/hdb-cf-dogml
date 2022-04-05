'use strict';

const pm2 = require('pm2');

async function stop () {
  await new Promise(r => pm2.connect(r));
  await new Promise(r => pm2.delete(this.trainerSlug, r));
  await new Promise(r => pm2.delete(this.classifierSlug, r));
  return {success: true, message: 'Scripts stopped.'}
}

module.exports = stop
