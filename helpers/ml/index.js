'use strict';

const os = require('os');
const path = require('path');

const setup = require('./methods/setup');
const reset = require('./methods/reset');
const train = require('./methods/train');
const stop = require('./methods/stop');
const classify = require('./methods/classify');

class ML {
  constructor(hdbCore, logger) {
    this.hdbCore = hdbCore;
    this.logger = logger;
    this.trainerSlug = 'hdbml_trainer';
    this.classifierSlug = 'hdbml_classifier';
    this.baseDir = path.join(os.homedir(), 'dogml');
    this.directories = ['scripts', 'training_data', 'models', 'uploaded_images'];
    this.trainingDataDirName = 'training_data';
    this.trainingDataDir = path.join(this.baseDir, this.trainingDataDirName);
    this.trainingDataUrl = 'http://vision.stanford.edu/aditya86/ImageNetDogs/images.tar';
    this.scripts = ['trainer.js', 'classifier.js'];
    this.scriptDirName = 'scripts';
    this.scriptDir = path.join(this.baseDir, this.scriptDirName);

    this.schema = 'demo';
    this.tables = ['log', 'classifications', 'models'];
  }
}

ML.prototype.setup = setup;
ML.prototype.reset = reset;
ML.prototype.train = train;
ML.prototype.stop = stop;
ML.prototype.classify = classify;

module.exports = ML;
