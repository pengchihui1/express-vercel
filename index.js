const express = require('express');
var cors = require('cors')
const _ = require('lodash');
const quickDraw = require('quickdraw.js');
const neataptic = require('neataptic');
const fs = require('fs');
const path = require('path');
const product = require("./api/product");

const app = express();

// const corsOptions = {
//   origin: "https://express-vercel-theta.vercel.app/"
// };
// app.use(cors(corsOptions));

//跨域CORS设置
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type,Access-Token,adminid");
    res.header("Access-Control-Expose-Headers", "*");
    //如果需要使用put和delete需要对OPTION返回响应
    if(req.method=='OPTIONS'){
	console.log(123456789)
        res.send('');
        return;
    }
    next();
});

// app.use(express.json({ extended: true }));

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

app.use("/api/product", product);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));
