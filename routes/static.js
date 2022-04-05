'use strict';

const path = require('path');
const homedir = require('os').homedir();
const fastifyStatic = require('fastify-static');

// eslint-disable-next-line no-unused-vars,require-await
module.exports = async (server) => {
  server.register(fastifyStatic, {
    root: path.join(__dirname, '../ui/build'),
    prefix: '/ui',
    prefixAvoidTrailingSlash: true,
    decorateReply: false,
  });
  server.register(fastifyStatic, {
    root: path.join(homedir, 'dogml/uploaded_images'),
    prefix: '/images',
    decorateReply: false,
  });
};
