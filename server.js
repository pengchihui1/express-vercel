const express = require('express');
var cors = require('cors')
const _ = require('lodash');
const quickDraw = require('quickdraw.js');
const neataptic = require('neataptic');
const fs = require('fs');
const path = require('path');

const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 4000;

const app = express();

app.use(cors())

app.use(express.json());

const categories = [
  'onion',
  'necklace',
  'beard',
  'angel',
  'light bulb',
  'mushroom'
];

function normalize(drawing) {
  let minX = 999999;
  let minY = 999999;
  let maxX = 0;
  let maxY = 0;
  let result = [];
  
  drawing.forEach((touch, index) => {
    const [xs, ys] = touch;
    minX = _.min([_.min(xs), minX]);
    minY = _.min([_.min(ys), minY]);
    maxX = _.max([_.max(xs), maxX]);
    maxY = _.max([_.max(ys), maxY]);
  });
  
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const range = _.max([rangeX, rangeY]);
  
  drawing.forEach((touch, index) => {
    let translatedtouch = _.chain(_.zip(...touch))
      .map(([x, y]) => [(x - minX) / range * 255, (y - minY) / range * 255]) // eslint-disable-line
      .unzip()
      .value();
      
    if (translatedtouch.length > 0) {
      result.push(translatedtouch);
    }
  });
  
  return result;
}

function resultFromNetwork(result) {
  return _.chain(_.zip(result, categories))
    .filter(([score, category]) => score >= 0.1)
    .sortBy(([score, category]) => -score)
    .value();
}

const network = neataptic.Network.fromJSON(JSON.parse(fs.readFileSync(path.join(__dirname, 'neural-net.json')))); // prettier-ignore

function guess(drawing) {

  const normalizedDrawing = normalize(drawing);
  const stim = quickDraw._strokeToArray(normalizedDrawing, 28);
  
  const result = network.activate(stim);
  console.log('result', _.chain(_.zip(result, categories))
    .sortBy(([score, category]) => -score)
    .value())
  /* prettier-ignore */
  const options = resultFromNetwork(result);
  
  
  let word = "";
  if (options.length > 0) {
    word = options[0][1];
  }
  
  return { word: word, options, normalizedDrawing };
}

app.post('/api/guess', (req, res) => {
  console.log('req.body.drawing', req.body.drawing)
  console.log('\n\n')
  const result = guess(req.body.drawing);

  res.json(result);
});

app.get('/', (req, res) => res.send('Opponent'));

/* prettier-ignore */
app.listen(port, host, () =>
  console.log(`Opponent listening on ${host}:${port}`)); // eslint-disable-line no-console
