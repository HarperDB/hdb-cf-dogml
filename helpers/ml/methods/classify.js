'use strict';

const path = require('path');
const pm2 = require('pm2');
const { v4: uuidv4 } = require('uuid');

async function classify(modelName, imageName) {
  const uid = uuidv4();
  let app;
  await new Promise(r => pm2.connect(r));
  const list = await new Promise(r => pm2.list((error, list) => r(list)))
  app = list.find(app => app.name === this.classifierSlug);
  if (!app || Object.keys(app.pm2_env).indexOf('exitCode') > -1) {
    const appObject = {
      script: path.resolve(this.scriptDir, 'classifier.js'),
      name: this.classifierSlug,
      exec_mode: 'fork',
      instances: 1,
      autorestart: false
    }
    await new Promise(r => pm2.start(appObject, (error, list) => r(list)))
    await new Promise(r => setTimeout(r, 15000));
    const list = await new Promise(r => pm2.list((error, list) => r(list)))
    app = list.find(app => app.name === this.classifierSlug);
    this.logger.notify(list);
  }
  this.logger.notify('app')
  this.logger.notify(JSON.stringify(app, null, 2));
  const message = {
    type: 'process:msg',
    data: {modelName, imageName, uid},
    topic: true
  }
  this.logger.notify(message)
  pm2.sendDataToProcessId(app.pm_id, message)
  const pm2Bus = await new Promise(r => pm2.launchBus((error, pm2Bus) => r(pm2Bus)))
  const packetData = await new Promise(r => pm2Bus.on('process:msg', (packet) => {
    if (packet.data.uid === uid) {
      r(packet.data)
    }
  }));

  pm2.disconnect();

  await this.hdbCore.requestWithoutAuthentication({
    body: {
      operation: 'insert',
      schema: this.schema,
      table: 'classifications',
      records: [packetData]
    }
  });

  return packetData;
}

module.exports = classify
