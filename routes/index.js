/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable consistent-return */
const express = require('express');
const jsonwebtoken = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const {
  getCityData, getScores, compare, validateSearchRequest, validateId, checkAuth,
} = require('../helpers/helpers');

const router = express.Router();
require('dotenv').config();

router.use(cors());

let comparisons = [];

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the quality life comparison API!' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log(`${username} is trying to login ..`);

  if (username === process.env.LOGIN && password === process.env.PASSWORD) {
    return res.json({
      token: jsonwebtoken.sign({ user: process.env.LOGIN }, process.env.JWT_SECRET),
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

router.post(
  '/search',
  checkAuth,
  validateSearchRequest(),
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstCity, secondCity } = req.body;

    try {
      const firstCityData = await getCityData(firstCity);
      const secondCityData = await getCityData(secondCity);

      const { cityName: firstCityName, ...firstCityScores } = await getScores(firstCityData);
      const { cityName: secondCityName, ...secondCityScores } = await getScores(secondCityData);

      const comparisonResults = compare(firstCityScores, secondCityScores);

      res.status(200).json({
        firstCity: firstCityName,
        secondCity: secondCityName,
        comparisonResults,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post('/comparison', checkAuth, (req, res) => {
  const comparison = req.body;

  comparison.id = uuidv4();

  comparisons.push(comparison);
  res.status(201).json({
    comparison_id: comparison.id,
    message: 'Comparison added successfully',
  });
});

router.get('/comparison/:id', checkAuth, validateId(), (req, res) => {
  const { id } = req.params;

  const comparison = comparisons.find((item) => item.id === id);
  if (comparison) {
    res.status(200).json(comparison);
  } else {
    res.status(404).json({ error: 'Comparison not found' });
  }
});

router.delete('/comparison/:id', checkAuth, validateId(), (req, res) => {
  const { id } = req.params;

  const comparison = comparisons.find((item) => item.id === id);

  if (!comparison) {
    res.status(404).json({ error: 'Comparison not found' });
  } else {
    comparisons = comparisons.filter((item) => item.id !== id);
    res.status(200).json({ message: 'Comparison deleted successfully' });
  }
});

module.exports = router;
