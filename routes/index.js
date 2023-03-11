const express = require('express');
const router = express.Router();
const { body, validationResult, check } = require('express-validator');
const { getCityData, getScores, compare } = require('../helpers/helpers')
const { v4: uuidv4 } = require('uuid');

let comparisons = require('../data/comparisons')

const validateSearchRequest = () => {
  return [
    body('firstCity').notEmpty().withMessage('First city name is required.').matches(/^[a-zA-Z\s]+$/).withMessage('First city name can only contain letters and whitespace.'),
    body('secondCity').notEmpty().withMessage('Second city name is required.').matches(/^[a-zA-Z\s]+$/).withMessage('Second city name can only contain letters and whitespace.'),
  ];
}

const validateId = () => {
  return [check('id').isUUID().withMessage('Comparison id must be a valid UUID.')]
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).render('index', { title: 'City life' });
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

    const firstCityScores = await getScores(firstCityData);
    const secondCityScores = await getScores(secondCityData);

    const comparisonResults = compare(firstCityScores, secondCityScores)

    res.status(200).json({ firstCity: firstCityScores.cityName, secondCity:secondCityScores.cityName, comparisonResults })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
);

router.post("/comparison", function (req, res) {
  const comparison = req.body

  comparison.id = uuidv4()
  
  comparisons.push(comparison)
  res.status(201).json({ 
    comparison_id: comparison.id,
    message: "Comparison added successfully" })
})

router.get("/comparison/:id", validateId(), function (req, res) {
  const id = req.params.id

  const comparison = comparisons.find(comparison => comparison.id === id)
  if (comparison) {
    res.status(200).json(comparison)
  } else {
    res.status(404).json({ error: "Comparison not found" })
  }
})

router.delete("/comparison/:id", validateId(), function (req, res) {
  const id = req.params.id
  
  const comparison = comparisons.find(comparison => comparison.id === id)

  if(!comparison) {
    res.status(404).json({ error: "Comparison not found" })
  } else {
    comparisons = comparisons.filter(comparison => comparison.id !== id)
    res.status(200).json({ message: "Comparison deleted successfully" })
  }
})

module.exports = router;


