const axios = require('axios');

async function yahooCek(sembol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sembol}?interval=1d&range=1d`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const fiyat = response.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return parseFloat(fiyat) || 0;
  } catch (e) {
    return 0;
  }
}

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
      return parseFloat(data.data[0].FIYAT.toString().replace(',', '.')) || 0;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // ONS (XAU/USD), USD/TRY kuru, fonlar paralel çek
    const [onsUsd, usdTry, tlyFiyat, pheFiyat] = await Promise.all([
      yahooCek('GC=F'),       // ONS altın USD
      yahooCek('USDTRY=X'),   // USD/TRY kuru
      fonFiyatCek('TLY'),
      fonFiyatCek('PHE')
    ]);

    // Gram altın hesapla: ONS / 31.1035 * USD/TRY
    const gramAltin = (onsUsd / 31.1035) * usdTry;
    const ceyrek = gramAltin * 1.75;
    const yarim = gramAltin * 3.5;
    const tam = gramAltin * 7.0;
    const ayar22 = gramAltin * (22 / 24) * 1.02;
    const ayar14 = gramAltin * (14 / 24) * 1.02;

    const sonuc = {
      altin: {
        HAS:    { alis: Math.round(gramAltin * 0.998), satis: Math.round(gramAltin * 1.002) },
        CEYREK: { alis: Math.round(ceyrek * 0.998),   satis: Math.round(ceyrek * 1.002) },
        YARIM:  { alis: Math.round(yarim * 0.998),    satis: Math.round(yarim * 1.002) },
        TAM:    { alis: Math.round(tam * 0.998),      satis: Math.round(tam * 1.002) },
        AYAR22: { alis: Math.round(ayar22 * 0.998),   satis: Math.round(ayar22 * 1.002) },
        AYAR14: { alis: Math.round(ayar14 * 0.998),   satis: Math.round(ayar14 * 1.002) },
        ONS:    { alis: Math.round(onsUsd * 0.999),   satis: Math.round(onsUsd * 1.001) },
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
