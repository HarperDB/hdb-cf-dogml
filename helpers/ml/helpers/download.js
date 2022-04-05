'use strict';

const fs = require('fs');
const http = require('http');

async function download (url, dest) {  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = http.get(url, (response) => response.pipe(file));

    file.on('finish', () => file.close(resolve));
    file.on('error', (error) => {
      fs.unlink(dest);
      return reject(error.message);
    });
    request.on('error', (error) => {
      fs.unlink(dest);
      return reject(error.message);
    });
  });
};

module.exports = download
