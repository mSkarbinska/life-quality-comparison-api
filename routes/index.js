var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Compare how it is to live in another city' });
});

const EMBED = encodeURI("city:search-results/city:item/city:urban_area/ua:scores")

router.post('/search', async function (req, res, next) {
  firstCity = req.body.firstCity
  secondCity = req.body.secondCity

  try {
    const firstCityScores = await fetch(`https://api.teleport.org/api/cities/?search=${encodeURI(firstCity)}&embed=${EMBED}`)
      .then(response => response.json()) 
      .then(data => data._embedded['city:search-results'][0]._embedded['city:item']._embedded['city:urban_area']._embedded['ua:scores'].categories);
    const secondCityScores = await fetch(`https://api.teleport.org/api/cities/?search=${encodeURI(secondCity)}&embed=${EMBED}`)
      .then(response => response.json())
      .then(data => data._embedded['city:search-results'][0]._embedded['city:item']._embedded['city:urban_area']._embedded['ua:scores'].categories);


    res.render('results', { firstCityScores, secondCityScores });

  } catch (error) {
    console.log(error);
    res.render('error');
    
  }
});

module.exports = router;


