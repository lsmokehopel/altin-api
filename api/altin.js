const axios = require('axios');

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

function temizle(str) {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/\./g, '').replace(',', '.')) || 0;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const [altinRes, tlyFiyat, pheFiyat] = await Promise.all([
      axios.get('https://bigpara.hurriyet.com.tr/api/v1/hisse/liste/altin', {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://bigpara.hurriyet.com.tr/'
        }
      }),
      fonFiyatCek('TLY'),
      fonFiyatCek('PHE')
    ]);

    const liste = altinRes.data?.data || [];

    const bul = (aramaKelimesi) => {
      const item = liste.find(x =>
        x.ad && x.ad.toLowerCase().includes(aramaKelimesi.toLowerCase())
      );
      return {
        alis: temizle(item?.alis),
        satis: temizle(item?.satis)
      };
    };

    const sonuc = {
      altin: {
        HAS:    bul('gram'),
        CEYREK: bul('çeyrek'),
        YARIM:  bul('yarım'),
        TAM:    bul('tam altın'),
        AYAR22: bul('22 ayar'),
        AYAR14: bul('14 ayar'),
        ONS:    bul('ons'),
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
