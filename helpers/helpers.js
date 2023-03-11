export const validateSearchRequest = () => {
    return [
        body('firstCity').notEmpty().withMessage('First city name is required.').matches(/^[a-zA-Z\s]+$/).withMessage('First city name can only contain letters and whitespace.'),
        body('secondCity').notEmpty().withMessage('Second city name is required.').matches(/^[a-zA-Z\s]+$/).withMessage('Second city name can only contain letters and whitespace.'),
    ];
}

export const validateId = () => {
    return [check('id').isUUID().withMessage('Comparison id must be a valid UUID.')]
}

export const getCityData = async (city) => {
    const data = await fetch(`https://api.teleport.org/api/cities/?search=${encodeURI(city)}&embed=${EMBED}`)
        .then(response => response.json());

    if (!data || data._embedded['city:search-results'].length === 0) {
        throw new Error(`No city named ${city} was found. Please check the name and try again.`)
    } else {
        return data?._embedded['city:search-results'][0]._embedded['city:item']._embedded['city:urban_area'];
    }
}


export const getScores = async (cityData) => {
    const cityName = cityData.full_name
    const categoriesScores = cityData._embedded['ua:scores'].categories
    const score = cityData._embedded['ua:scores'].teleport_city_score

    // get data about weather
    const cityDetailsUrl = cityData._links['ua:details'].href
    const weatherDetails = await fetch(cityDetailsUrl).then(response => response.json()).then(data => data.categories[2].data)

    const avNumRainyDays = weatherDetails.find(detail => detail.id === "WEATHER-AV-NUMBER-RAINY-DAYS");
    const avHighTemp = weatherDetails.find(detail => detail.id === "WEATHER-AVERAGE-HIGH");
    const avLowTemp = weatherDetails.find(detail => detail.id === "WEATHER-AVERAGE-LOW");

    const weatherScore = ((365.0 - avNumRainyDays?.float_value) - Math.abs(parseFloat(avHighTemp?.string_value) - PERFECT_TEMPERATURE) - Math.abs(PERFECT_TEMPERATURE - parseFloat(avLowTemp?.string_value))) / 365 * 100

    return { cityName, categoriesScores, qualityOfLiveScore: score, weatherScore: weatherScore.toFixed(2), totalScore: (score + weatherScore) / 2 }
}


export const compare = (firstCityScores, secondCityScores) => {
    let result = {}
    firstCityScores.categoriesScores.forEach((category, index) => {
        const firstCityScore = category.score_out_of_10
        const secondCityScore = secondCityScores.categoriesScores[index].score_out_of_10
        result[category.name] = { winner: firstCityScore > secondCityScore ? firstCityScores.cityName : secondCityScores.cityName, difference: Math.abs(firstCityScore - secondCityScore).toFixed(2) }
    })

    let resultsSummary = {}

    //compare quality of live score
    const firstCityQualityOfLiveScore = firstCityScores.qualityOfLiveScore
    const secondCityQualityOfLiveScore = secondCityScores.qualityOfLiveScore
    resultsSummary['qualityOfLive'] = { winner: firstCityQualityOfLiveScore > secondCityQualityOfLiveScore ? firstCityScores.cityName : secondCityScores.cityName, difference: Math.abs(firstCityQualityOfLiveScore - secondCityQualityOfLiveScore).toFixed(2) }

    const firstCityWeatherScore = firstCityScores.weatherScore
    const secondCityWeatherScore = secondCityScores.weatherScore

    //overall winner
    if (!firstCityWeatherScore || !secondCityWeatherScore || isNaN(firstCityWeatherScore) || isNaN(secondCityWeatherScore)) {
        resultsSummary['weather'] = { winner: null, difference: null }

        const firstCityTotalScore = firstCityQualityOfLiveScore
        const secondCityTotalScore = secondCityQualityOfLiveScore
        resultsSummary['total'] = { winner: firstCityTotalScore > secondCityTotalScore ? firstCityScores.cityName : secondCityScores.cityName, difference: Math.abs(firstCityTotalScore - secondCityTotalScore).toFixed(2) }
    } else {
        //compare weather score
        resultsSummary['weather'] = { winner: firstCityWeatherScore > secondCityWeatherScore ? firstCityScores.cityName : secondCityScores.cityName, difference: Math.abs(firstCityWeatherScore - secondCityWeatherScore).toFixed(2) }

        const firstCityTotalScore = firstCityScores.totalScore
        const secondCityTotalScore = secondCityScores.totalScore
        resultsSummary['total'] = { winner: firstCityTotalScore > secondCityTotalScore ? firstCityScores.cityName : secondCityScores.cityName, difference: Math.abs(firstCityTotalScore - secondCityTotalScore).toFixed(2) }
    }

    return { ...result, resultsSummary }
}
