const fs = require('fs');
const fetch = require('node-fetch');

const delay = (ms) => new Promise((result) => setTimeout(() => result(), ms));
const file = 'cities.txt';

//make Array of cties from txt file
const cities = fs
  .readFileSync(file, 'utf-8', (data) => data)
  .trim()
  .split('\n');

// Take city OSM ID on nominatim.openstreetmap
const findCityOSMid = async (city) => {
  const cityUrl = encodeURI(
    `https://nominatim.openstreetmap.org/search?q=${city}&format=json`
  );
  const response = await fetch(cityUrl);
  const data = await response.json();
  for (let i in data) {
    if (data[i].display_name.match(/Россия/) !== null) {
      return data[i].osm_id;
    }
  }
  throw Error(`Не найден идентификатор для города ${city}`);
};

//Take border data and save in file
const takeBorder = async (city) => {
  await delay(2000);
  const cityOSMid = await findCityOSMid(city);
  const borderUrl = encodeURI(
    `https://polygons.openstreetmap.fr/get_geojson.py?id=${cityOSMid}&params=0`
  );

  const response = await fetch(borderUrl);

  const data = await response.json();

  await fs.writeFile(`./geojsons/${city}.txt`, JSON.stringify(data), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
};

const makeGeoJson = async () => {
  for (let i in cities) {
    const city = cities[i];
    try {
      await takeBorder(city);
    } catch (e) {
      console.error(
        `При отправке запроса возникла ошибка!\n ${e} \n Переходим к следующему городу`
      );
      continue;
    }
  }
};
makeGeoJson();
