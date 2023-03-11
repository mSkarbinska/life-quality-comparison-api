const express = require('express');
const router = express.Router();

const EMBED = encodeURI("city:search-results/city:item/city:urban_area/ua:scores")
const PERFECT_TEMPERATURE = 22.0 //in Celcius

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'City life' });
});


router.post('/search', async function (req, res, next) {
  firstCity = req.body.firstCity
  secondCity = req.body.secondCity

  try {
    const firstCityData = await getCityData(firstCity);
    const secondCityData = await getCityData(secondCity);

    const firstCityScores = await getScores(firstCityData).then(data=>data)
    const secondCityScores = await getScores(secondCityData).then(data=>data)

    const comparisonResults = compare(firstCityScores, secondCityScores)

    res.json({ firstCityScores, secondCityScores, comparisonResults })
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: error.message })
  }
}
);

const getCityData = async (city) => {
  const data = await fetch(`https://api.teleport.org/api/cities/?search=${encodeURI(city)}&embed=${EMBED}`)
    .then(response =>response.json());

  if (!data) {
    throw new Error("No city found")
  } else{
    return data?._embedded['city:search-results'][0]._embedded['city:item']._embedded['city:urban_area'];
  }
}

const getScores = async (cityData) => {
  const cityName = cityData.full_name
  const categoriesScores = cityData._embedded['ua:scores'].categories
  const score = cityData._embedded['ua:scores'].teleport_city_score

  // get data about weather
  const cityDetailsUrl = cityData._links['ua:details'].href
  const weatherDetails = await fetch(cityDetailsUrl).then(response => response.json()).then(data => data.categories[2].data)

  const avNumRainyDays = weatherDetails.find(detail => detail.id === "WEATHER-AV-NUMBER-RAINY-DAYS");
  const avHighTemp = weatherDetails.find(detail => detail.id === "WEATHER-AVERAGE-HIGH");
  const avLowTemp = weatherDetails.find(detail => detail.id === "WEATHER-AVERAGE-LOW");

  const weatherScore = ((365.0 - avNumRainyDays.float_value) - Math.abs(parseFloat(avHighTemp.string_value) - PERFECT_TEMPERATURE) - Math.abs(PERFECT_TEMPERATURE - parseFloat(avLowTemp.string_value)))/365 * 100

  return { cityName, categoriesScores, qualityOfLiveScore:score, weatherScore, totalScore: (score + weatherScore)/2}
}

const compare = (firstCityScores, secondCityScores) => {
  let result = {}
  firstCityScores.categoriesScores.forEach((category, index) => {
    const firstCityScore = category.score_out_of_10
    const secondCityScore = secondCityScores.categoriesScores[index].score_out_of_10
    result[category.name] = {winner: firstCityScore > secondCityScore ? firstCityScores.cityName : secondCityScores.cityName, difference: Math.abs(firstCityScore - secondCityScore)}
  })

  //compare quality of live score
  const firstCityQualityOfLiveScore = firstCityScores.qualityOfLiveScore
  const secondCityQualityOfLiveScore = secondCityScores.qualityOfLiveScore
  result['qualityOfLive'] = {winner: firstCityQualityOfLiveScore > secondCityQualityOfLiveScore ? firstCityScores.cityName : secondCityScores.cityName, difference: Math.abs(firstCityQualityOfLiveScore - secondCityQualityOfLiveScore)}

  //compare weather score
  const firstCityWeatherScore = firstCityScores.weatherScore
  const secondCityWeatherScore = secondCityScores.weatherScore
  result['weather'] = {winner: firstCityWeatherScore > secondCityWeatherScore ? firstCityScores.cityName : secondCityScores.cityName, difference: Math.abs(firstCityWeatherScore - secondCityWeatherScore)}

  //overall winner
  const firstCityTotalScore = firstCityScores.totalScore
  const secondCityTotalScore = secondCityScores.totalScore
  result['total'] = {winner: firstCityTotalScore > secondCityTotalScore ? firstCityScores.cityName : secondCityScores.cityName, difference: Math.abs(firstCityTotalScore - secondCityTotalScore)}

  return result
}

module.exports = router;


