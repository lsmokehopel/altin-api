const axios = require('axios');
const cheerio = require('cheerio');

async function fonFiyatCek(fonKodu) {
  try {
    const bugun = new Date();
    const bitis = bugun.toISOString().split('T')[0];
    bugun.setDate(bugun.getDate() - 7);
    const baslangic = bugun.toISOString().split('T')[0];

    const url = `https://www.tefas.gov.tr/api/DB/BindHistoryInfo?fontip=YAT&bastarih=${baslangic}&bittarih=${bitis}&fonkodu=${fonKodu}`;
    const response = await axios.get(url, {
      headers: {
        'Referer': 'https://www.tefas.gov.tr/',
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const data = response.data;
    if (data && data.data && data.data.length > 0) {
      const fiyat = data.data[0].FIYAT;
      return parseFloat(fiyat.toString().replace(',', '.')) || 0;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const [altinRes, tlyFiyat, pheFiyat] = await Promise.all([
      axios.get('https://altin.doviz.com', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'tr-TR,tr;q=0.9',
        }
      }),
      fonFiyatCek('TLY'),
      fonFiyatCek('PHE')
    ]);

    const $ = cheerio.load(altinRes.data);
    const sonuc = {};

    // Debug: tüm data-id ve fiyatları çek
    $('[data-socket]').each((i, el) => {
      const socket = $(el).attr('data-socket');
      const alis = $(el).find('[data-socket-attr="buy"]').text().trim();
      const satis = $(el).find('[data-socket-attr="sell"]').text().trim();
      if (socket && alis) {
        sonuc[socket] = { alis, satis };
      }
    });

    res.status(200).json({
      basarili: true,
      debug: sonuc,
      fonlar: {
        TLY: { fiyat: tlyFiyat },
        PHE: { fiyat: pheFiyat }
      }
    });

  } catch (e) {
    res.status(500).json({ basarili: false, hata: e.message });
  }
};
