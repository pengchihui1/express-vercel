const quickDraw = require('quickdraw.js');
const neataptic = require('neataptic');
const fs = require('fs');
const path = require('path');

const categories = [
  'onion',
  'necklace',
  'beard',
  'angel',
  'light bulb',
  'mushroom'
];

const dataSet = quickDraw.set(600, categories);

const network = new neataptic.architect.Perceptron(
  dataSet.input,
  30,
  dataSet.output,
);

network.train(dataSet.set, {
  iterations: 100,
  log: 1,
  rate: 0.1,
});

const neuralNet = JSON.stringify(network.toJSON());

fs.writeFile(path.join(__dirname, 'neural-net.json'), neuralNet, () =>
  console.log('Done training neural net')); // prettier-ignore
