const fs = require('fs');
const os = require('os'); 
const path = require('path');
const { performance } = require('perf_hooks');

main()

async function main() {
  const processor = process.argv[2];
  const modelName = process.argv[3];

  const tfModule = (processor === 'GPU') ? 'tfjs-node-gpu' : 'tfjs-node';
  const tf = require(`@tensorflow/${tfModule}`);
  const mobilenet = require('@tensorflow-models/mobilenet');
  const knnClassifier = require('@tensorflow-models/knn-classifier');

  const trainingStartTime = performance.now()
  const net = await mobilenet.load({version: 2, alpha: 1});
  const classifier = knnClassifier.create();

  const trainingDataDir = path.join(__dirname, '../training_data/Images');
  const directories = fs.readdirSync(trainingDataDir)
  const classes = directories // .slice(0, 10)
  const startTime = performance.now()
  process.send({
    type: 'process:msg',
    data: {message: 'Beginning to train mode', modelName, processor, classes}
  })

  for (let classIdx in classes) {
    const className = classes[classIdx]
    const files = fs.readdirSync(`${trainingDataDir}/${className}`)
    const selection = files //.slice(0, 20);
    const tfused = tf.memory().numBytes / 1024 / 1024;
    const nused = process.memoryUsage().heapUsed / 1024 / 1024;
    process.send({
      type: 'process:msg',
      data: {modelName, classIdx, totalClasses: classes.length, tfused, nused}
    })
    for (let fileName of selection) {
      tf.engine().startScope();
      const path = `${trainingDataDir}/${className}/${fileName}`
      const buf = fs.readFileSync(path)
      let tensor = tf.node.decodeJpeg(buf)
      const minShape = Math.min(...tensor.shape.slice(0, 2))
      const height = tensor.shape[0]
      const width = tensor.shape[1]
      const top = ((height - minShape) / 2) / height
      const bottom = ((height + minShape) / 2) / height
      const left = ((width - minShape) / 2) / width
      const right = ((width + minShape) / 2) / width
      tensor = tf.image.cropAndResize(tensor.expandDims(0), [[top, left, bottom, right]], [0], [224, 224], 'nearest')
      tensor = tf.squeeze(tensor, 0)
      tensor = tf.div(tensor, 255)
      try {
        tensor = net.infer(tensor, true);
        classifier.addExample(tensor, className);
      } catch (error) {
        console.log('error', error);
      }
      tf.engine().endScope();
    }
  }

  const trainingEndTime = performance.now()
  const trainingDuration = (trainingEndTime - trainingStartTime) / 1000

  const classifierWeights = JSON.stringify( Object.entries(classifier.getClassifierDataset()).map(([label, data])=>[label, Array.from(data.dataSync()), data.shape]) );
  const modelDir = path.join(__dirname, '../models')
  fs.writeFileSync(`${modelDir}/${modelName}.json`, classifierWeights)

  process.send({
    type: 'process:msg',
    data: {modelName, complete: true, trainingDuration}
  })

}
