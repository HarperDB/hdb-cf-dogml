'use strict';

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const tar = require('tar-fs');
const download = require('../helpers/download.js');

async function setup (update) {
  try {
    await createDirectories.apply(this);
  } catch (error) {
    const message = 'Could not create ML directories';
    this.logger.fatal(`${message}. error: ${error.message}`);
    return { success: false, message};
  }

  try {
    await copyScripts.apply(this, [update]);
  } catch (error) {
    const message = 'Could not copy ML scripts';
    this.logger.fatal(`${message}. error: ${error.message}`);
    return { success: false, message};
  }

  if (update) {
    return { success: true, message: 'ML setup updated'}; 
  }

  try {
    await createSchema.apply(this);
  } catch (error) {
    const message = 'Could not create ML schema';
    this.logger.fatal(`${message}. error: ${error.message}`);
    return { success: false, message};
  }

  try {
    await downloadData.apply(this);
  } catch (error) {
    const message = 'Could not download ML training data';
    this.logger.fatal(`${message}. error: ${error.message}`);
    return { success: false, message};
  }

  try {
    await installModules.apply(this);
  } catch (error) {
    const message = 'Could not install ML modules';
    this.logger.fatal(`${message}. error: ${error.message}`);
    return { success: false, message};
  }

  this.logger.notify('ML setup complete!');
  return { success: true, message: 'ML setup complete'};
}

function createDirectories() {
  this.logger.notify(`Checking for base ML directory: ${this.baseDir}.`)
  let already = 'already ';
  if (!fs.existsSync(this.baseDir)){
    already = '';
    this.logger.notify(`Base ML directory not found. Creating ${this.baseDir}.`)
    fs.mkdirSync(this.baseDir);
  }
  this.logger.notify(`Base ML directory ${this.baseDir} ${already}created.`)
  for (let directory of this.directories) {
    const dirPath = path.join(this.baseDir, directory);
    already = 'already '
    this.logger.notify(`Checking for ML directory: ${dirPath}.`)
    if (!fs.existsSync(dirPath)){
      already = ''
      this.logger.notify(`ML directory not found. Creating ${dirPath}.`)
      fs.mkdirSync(dirPath);
    }
    this.logger.notify(`ML directory ${this.baseDir} ${already}created.`)
  }
}

async function copyScripts(update) {
  for (let script of this.scripts) {
    let already = 'already ';
    const srcPath = path.join(__dirname, '../scripts', script);
    const destPath = path.join(this.scriptDir, script)
    this.logger.notify(`Checking for script ${script}.`);
    if (!fs.existsSync(destPath) || update) {
      already = '';
      this.logger.notify(`Copying script ${script}.`);
      fs.copyFileSync(srcPath, destPath);
    }
    this.logger.notify(`Script ${script} ${already}copied.`)
  }
}

async function createSchema() {
  let already = 'already ';
  this.logger.notify(`Checking for ML schema ${this.schema}.`)
  try {
    await this.hdbCore.requestWithoutAuthentication({
      body: {
        operation: 'describe_schema',
        schema: this.schema
      }
    });
  } catch (error) {
    already = '';
    this.logger.notify(`ML schema does not exist. Creating ${this.schema} schema.`)
    await this.hdbCore.requestWithoutAuthentication({
      body: {
        operation: 'create_schema',
        schema: this.schema
      }
    });
  }
  this.logger.notify(`ML schema ${this.schema} ${already}created.`)

  for (let table of this.tables) {
    already = 'already ';
    this.logger.notify(`Checking for ML table ${this.schema}.${table}.`)
    try {
      await this.hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'describe_table',
          schema: this.schema,
          table
        }
      });
    } catch (error) {
      already = '';
      this.logger.notify(`ML table does not exist. Creating ${this.schema}.${table}.`)
      await this.hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'create_table',
          schema: this.schema,
          table,
          hash_attribute: 'id'
        }
      });
    }
    this.logger.notify(`ML table ${this.schema}.${table} ${already}created.`)
  }
}

async function downloadData() {
  let already = 'already ';
  const extractedPath = path.join(this.trainingDataDir, 'Images')
  const tarFilePath = this.trainingDataDir + '/images.tar';
  this.logger.notify(`Checking for training data ${extractedPath}`);
  if (!fs.existsSync(extractedPath)) {
    this.logger.notify(`Training data does not exist. Checking for tar file ${tarFilePath}.`);
    if (!fs.existsSync(tarFilePath)) {
      already = '';
      this.logger.notify(`Training data tar file does not exist. Downloading from ${this.trainingDataUrl}.`);
      await download(this.trainingDataUrl, tarFilePath);
    }
    this.logger.notify(`Training data tar file ${already}downloaded to ${tarFilePath}.`);      

    this.logger.notify(`Extracting training data to ${extractedPath}.`);
    fs.createReadStream(tarFilePath).pipe(tar.extract(this.trainingDataDir));
  }
  this.logger.notify(`Training data ${already}ready.`);
}

async function installModules() {
  let already = 'already ';
  this.logger.notify('Checking for TensorFlow modules');
  const tensorFlowDir = path.join(this.scriptDir, 'node_modules', '@tensorflow');
  if (!fs.existsSync(tensorFlowDir)) {
    already = '';
    this.logger.notify('TensorFlow not found. Installing now.');
    await new Promise((resolve, reject) => {
      exec('npm install @tensorflow/tfjs-node @tensorflow/tfjs-node-gpu',
        {cwd: this.scriptDir},
        (error, stdout, stderror) => {
          if (error) {
            return reject(error);
          }
          resolve()
        }
      );
    });
  }
  this.logger.notify(`TensorFlow ${already}installed!`)

  already = 'already '
  const mobilenetDir = path.join(this.scriptDir, 'node_modules', '@tensorflow-models');
  this.logger.notify('Checking for MobileNet modules');
  if (!fs.existsSync(mobilenetDir)) {
    already = '';
    this.logger.notify('MobileNet not found. Installing now.');
    await new Promise((resolve, reject) => {
      exec('npm install @tensorflow-models/mobilenet @tensorflow-models/knn-classifier',
        {cwd: this.scriptDir},
        (error, stdout, stderror) => {
          if (error) {
            return reject(error);
          }
          resolve()
        }
      );
    });
  }
  this.logger.notify(`MobileNet ${already}installed!`)

}

module.exports = setup
