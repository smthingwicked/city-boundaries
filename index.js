const fs = require('fs');
const fetch = require('node-fetch');

const delay = (ms) => new Promise((result) => setTimeout(() => result(), ms));

// Take city OSM ID from nominatim.openstreetmap
const findCityOSMid = async (city) => {
  const cityUrl = encodeURI(`https://nominatim.openstreetmap.org/search?q=${city}&format=json`);

  const response = await fetch(cityUrl);
  const data = await response.json();

  const cityOSMid = data.find(({ class: klazz, type, display_name }) => {
    return klazz === 'place' && ['town', 'city'].includes(type) && display_name.includes('Россия');
  });

  return cityOSMid ? cityOSMid.osm_id : null;
};

//Take city border
const takeBorder = async (city) => {
  await delay(2000);
  const cityOSMid = await findCityOSMid(city);

  const borderUrl = encodeURI(
    `https://polygons.openstreetmap.fr/get_geojson.py?id=${cityOSMid}&params=0`
  );

  const response = await fetch(borderUrl);

  if (!response.headers.get('content-encoding')) {
    console.error(`Не найдены геоданные для города ${city}, OSM OD = ${cityOSMid}`);
    return null;
  }

  return await response.json();
};

const makeGeoJson = async (filePath) => {
  let boundaries = {};

  //make Array of cties from txt file
  const cities = await fs
    .readFileSync(filePath, 'utf-8', (data) => data)
    .trim()
    .split('\n');

  for (let i in cities) {
    const city = cities[i];

    const boundary = await takeBorder(city);

    boundaries = boundary ? { ...boundaries, [city]: boundary } : boundaries;
  }

  await fs.writeFile(`./geojsons/boundaries.json`, JSON.stringify(boundaries), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
};
makeGeoJson('cities.txt');
