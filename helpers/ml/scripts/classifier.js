'use strict';

const fs = require('fs');
const os = require('os'); 
const path = require('path');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const knnClassifier = require('@tensorflow-models/knn-classifier');
const { performance } = require('perf_hooks');

const stack = [];
const o = {};

main()

async function main() {
  o.net = await mobilenet.load({version: 2, alpha: 1});
  o.classifier = knnClassifier.create();
  process.on('message', (packet) => {
    stack.push(packet.data)
    if (stack.length > 1) {
      return;
    }
    return classify();
  });
}

async function classify() {
  const data = stack.shift();
  const { modelName, imageName, uid } = data;

  const fileLocation = path.join(__dirname, '../uploaded_images', imageName);
  const fileUrl = `http://localhost:9926/dogml/images/${imageName}`;
  if (o.modelName !== modelName) {
    const modelPath = path.join(__dirname, '../models/', modelName + '.json');
    const savedModelString = fs.readFileSync(modelPath);
    o.classifier.setClassifierDataset( Object.fromEntries( JSON.parse(savedModelString).map(([label, data, shape])=>[label, tf.tensor(data, shape)]) ) );
    o.modelName = modelName;
  }
  

  const startTime = performance.now()

  const buffer = fs.readFileSync(fileLocation)
  let tensor = tf.node.decodeJpeg(buffer)
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
  tensor = o.net.infer(tensor, true);
  const prediciton = await o.classifier.predictClass(tensor)
  const endTime = performance.now()

  const classificationObject = {
    image_name: imageName,
    image_url: fileUrl,
    breed: prediciton.label,
    confidence: prediciton.confidences[prediciton.label],
    time_to_classify: (endTime-startTime),
    model_name: modelName,
    prediciton: JSON.stringify(prediciton),
    uid
  }

  process.send({
    type: 'process:msg',
    data: classificationObject
  })

  if (stack.length) {
    classify();
  }
}
