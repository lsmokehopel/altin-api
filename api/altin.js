const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await axios.get('https://doviz.com/altin', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(response.data);
    
    // Tüm tabloları ve içeriklerini görelim
    const debug = [];
    $('table tbody tr').each((i, el) => {
      const cols = [];
      $(el).find('td').each((j, td) => {
        cols.push($(td).text().trim());
      });
      debug.push(cols);
    });

    res.status(200).json({ debug });

  } catch (e) {
    res.status(500).json({ hata: e.message });
  }
};
