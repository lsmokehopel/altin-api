const axios = require('axios');

// TEFAS'tan fon fiyatı çeken fonksiyon
async function fonFiyatCek(fonKodu) {
  try {
    const url = `https://www.tefas.gov.tr/api/DB/BindHistoryInfo?fontip=YAT&bastarih=&bittarih=&fonkodu=${fonKodu}`;
    const response = await axios.get(url, {
      headers: {
        'Referer': 'https://www.tefas.gov.tr/',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const data = response.data;
    if (data && data.data && data.data.length > 0) {
      return parseFloat(data.data[0].FIYAT);
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // Altın ve fon verilerini paralel çek
    const [altinResponse, tlyFiyat, pheFiyat] = await Promise.all([
      axios.get('https://canlipiyasalar.haremaltin.com/tmp/altin.json', {
        headers: {
          'Referer': 'https://www.haremaltin.com/',
          'User-Agent': 'Mozilla/5.0'
        }
      }),
      fonFiyatCek('TLY'),
      fonFiyatCek('PHE')
    ]);

    const data = altinResponse.data.data;

    const sonuc = {
      altin: {
        HAS:    { alis: parseFloat(data['ALTIN']?.alis)      || 0, satis: parseFloat(data['ALTIN']?.satis)      || 0 },
        CEYREK: { alis: parseFloat(data['CEYREK_YENI']?.alis) || 0, satis: parseFloat(data['CEYREK_YENI']?.satis) || 0 },
        YARIM:  { alis: parseFloat(data['YARIM_YENI']?.alis)  || 0, satis: parseFloat(data['YARIM_YENI']?.satis)  || 0 },
        TAM:    { alis: parseFloat(data['TEK_YENI']?.alis)    || 0, satis: parseFloat(data['TEK_YENI']?.satis)    || 0 },
        AYAR22: { alis: parseFloat(data['22_AYAR_BILEZIK']?.alis) || 0, satis: parseFloat(data['22_AYAR_BILEZIK']?.satis) || 0 },
        AYAR14: { alis: parseFloat(data['14_AYAR']?.alis)     || 0, satis: parseFloat(data['14_AYAR']?.satis)     || 0 },
        ONS:    { alis: parseFloat(data['ONS']?.alis)         || 0, satis: parseFloat(data['ONS']?.satis)         || 0 },
      },
      fonlar: {
        TLY: { fiyat: tlyFiyat },
        PHE: { fiyat: pheFiyat }
      }
    };

    res.status(200).json({ basarili: true, veri: sonuc });

  } catch (e) {
    res.status(500).json({ basarili: false, hata: e.message });
  }
};
