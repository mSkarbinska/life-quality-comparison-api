const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getCityData, getScores, compare, validateId } = require('../helpers/helpers')
const { v4: uuidv4 } = require('uuid');

let comparisons = require('../data/comparisons.js')

const EMBED = encodeURI("city:search-results/city:item/city:urban_area/ua:scores")
const PERFECT_TEMPERATURE = 22.0 // in Celcius


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'City life' });
});

router.post('/search', validateSearchRequest(),
async function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  firstCity = req.body.firstCity
  secondCity = req.body.secondCity

  try {
    const firstCityData = await getCityData(firstCity);
    const secondCityData = await getCityData(secondCity);

    const firstCityScores = await getScores(firstCityData).then(data=>data)
    const secondCityScores = await getScores(secondCityData).then(data=>data)

    const comparisonResults = compare(firstCityScores, secondCityScores)

    res.json({ comparisonResults })
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: error.message })
  }
}
);

router.post("/comparison", function (req, res, next) {
  const comparison = req.body

  comparison.id = uuidv4()
  
  comparisons.push(comparison)
  res.json({ 
    comparison_id: comparison.id,
    message: "Comparison added successfully" })
})

router.get("/comparison/:id", validateId(), function (req, res, next) {
  const id = req.params.id

  const comparison = comparisons.find(comparison => comparison.id === id)
  if (comparison) {
    res.json(comparison)
  } else {
    res.status(404).json({ error: "Comparison not found" })
  }
})


module.exports = router;


