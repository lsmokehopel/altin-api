const axios = require('axios');

async function fonFiyatCek(fonKodu) {
  try {
    const bugun = new Date();
    const bitis = bugun.toLocaleDateString('tr-TR').split('.').reverse().join('-');
    bugun.setDate(bugun.getDate() - 7);
    const baslangic = bugun.toLocaleDateString('tr-TR').split('.').reverse().join('-');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const [altinResponse, tlyFiyat, pheFiyat] = await Promise.all([
      axios.get('https://altinapi.com/api/v1/prices', {
        headers: {
          'X-API-Key': 'hapi_0b320efeff5b41419bc3093ecb45f405'
        }
      }),
      fonFiyatCek('TLY'),
      fonFiyatCek('PHE')
    ]);

    const data = altinResponse.data.data;

    const sembolBul = (sembol) => {
      const bulunan = data.find(d => d.symbol === sembol);
      return {
        alis: bulunan?.bid || 0,
        satis: bulunan?.ask || 0
      };
    };

    const sonuc = {
      altin: {
        HAS:    sembolBul('ALTIN'),
        CEYREK: sembolBul('CEYREK_YENI'),
        YARIM:  sembolBul('YARIM_YENI'),
        TAM:    sembolBul('TEK_YENI'),
        AYAR22: sembolBul('22_AYAR_BILEZIK'),
        AYAR14: sembolBul('14_AYAR'),
        ONS:    sembolBul('XAUUSD'),
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
