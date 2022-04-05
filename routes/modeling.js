'use strict';

const { uniqueNamesGenerator, adjectives, animals } = require('unique-names-generator');

const os = require('os');
const fs = require('fs');
const pm2 = require('pm2');

const ML = require('../helpers/ml');

function getName () {
  const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, animals] });

  const shortName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    length: 2
  });

  return shortName;
}

// eslint-disable-next-line no-unused-vars,require-await
module.exports = async (server, { hdbCore, logger }) => {

  const ml = new ML(hdbCore, logger)

  // create schema, download training data
  server.route({
    url: '/setup',
    method: 'GET',
    handler: async (request) => {
      const response = await ml.setup();
      return response;
    }
  });

  // remove schema
  server.route({
    url: '/reset',
    method: 'GET',
    handler: async (request) => {
      const response = await ml.reset();
      return response;
    }
  });

  // create schema, download training data
  server.route({
    url: '/update',
    method: 'GET',
    handler: async (request) => {
      const response = await ml.setup(true);
      return response;
    }
  });

  // create schema, download training data
  server.route({
    url: '/train',
    method: 'GET',
    handler: async (request) => {
      const response = await ml.train('CPU', getName());
      return response;
    }
  });

  // create schema, download training data
  server.route({
    url: '/train_gpu',
    method: 'GET',
    handler: async (request) => {
      const response = await ml.train('GPU', getName());
      return response;
    }
  });

  server.route({
    url: '/stop',
    method: 'GET',
    handler: async (request) => {
      const response = await ml.stop();
      return response;
    }
  });

  server.route({
    url: '/pm2List',
    method: 'GET',
    handler: async (request) => {
      await new Promise(r => pm2.connect(r))
      const list = await new Promise(r => pm2.list((error, list) => r(list)))
      return JSON.stringify(list, null, 2)
    }
  });

  // // accept base64encoded image and return it's breed
  server.route({
    url: '/classify',
    method: 'POST',
    handler: async (request) => {
      const { imageData, imageName } = request.body;
      const imageBuffer = new Buffer(imageData, 'base64');
      const fileLocation = `${os.homedir()}/dogml/uploaded_images/${imageName}`;
      const fileUrl = `http://localhost:9926/dogml/uploaded_images/${imageName}`;
      fs.writeFileSync(fileLocation, imageBuffer);
      const results = await hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'sql',
          sql: 'SELECT name FROM demo.models ORDER BY __createdtime__ DESC LIMIT 1'
        }
      });
      const modelName = results[0].name

      const classificationObject = await ml.classify(modelName, imageName)

      return classificationObject;
    }
  });

};
