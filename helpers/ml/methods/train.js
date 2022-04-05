'use strict';

const path = require('path');
const pm2 = require('pm2');

async function train (processor, modelName) {
  await new Promise(r => pm2.connect(r));
  const list = await new Promise(r => pm2.list((error, list) => r(list)))
  const app = list.find(apps => apps.name === this.trainerSlug);
  if (app) {
    return {success: false, message: 'Training already running.'};
  }
  const appObject = {
    script: path.resolve(this.scriptDir, 'trainer.js'),
    name: this.trainerSlug,
    args: `${processor} ${modelName}`,
    exec_mode: 'fork',
    instances: 1,
    autorestart: false
  }
  await new Promise(r => pm2.start(appObject, r))
  const pm2Bus = await new Promise(r => pm2.launchBus((error, pm2Bus) => r(pm2Bus)));
  await new Promise(resolve => {
    pm2Bus.on('process:msg', (packet) => {
      this.logger.notify(packet.data);
      this.hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'insert',
          schema: this.schema,
          table: 'log',
          records: [packet.data]
        }
      })
      if (packet.data.complete) {
        this.hdbCore.requestWithoutAuthentication({
          body: {
            operation: 'insert',
            schema: this.schema,
            table: 'models',
            records: [{name: modelName}]
          }
        })
        resolve();
      }
    });
  });
  await new Promise(r => pm2.delete(this.trainerSlug, r));
  return {success: true, message: 'Training started.'};
}

module.exports = train
