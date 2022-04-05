'use strict';

const fs = require('fs');
const path = require('path');

async function reset () {
  deleteDirectories.apply(this);
  await dropSchema.apply(this);

  return { success: true, message: 'ML setup removed'};
}

function deleteDirectories() {
  this.logger.notify(`Removing ML directories inside ${this.baseDir}.`)
  for (let directory of this.directories) {
    const dirPath = path.join(this.baseDir, directory);
    let already = 'already ';
    if (fs.existsSync(dirPath)) {
      already = '';
      this.logger.notify(`Removing ML directory ${dirPath}.`)
      fs.rmSync(dirPath, {recursive: true, force: true})
    }
    this.logger.notify(`ML directory ${dirPath} ${already}removed.`)
  }
}

async function dropSchema() {
  this.logger.notify(`Removing ML schema ${this.schema}.`)
  let already = '';
  try {
    await this.hdbCore.requestWithoutAuthentication({
      body: {
        operation: 'drop_schema',
        schema: this.schema
      }
    });
  } catch (error) {
    already = 'already ';
  }
  this.logger.notify(`ML schema ${this.schema} ${already}removed.`)
}

module.exports = reset
