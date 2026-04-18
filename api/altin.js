const axios = require('axios');
const cheerio = require('cheerio');

async function fonFiyatCek(fonKodu) {
  try {
    const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fonKodu}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(response.data);
    const fiyatText = $('.top-info-area .top-info-second li').first().find('span').last().text().trim();
    return parseFloat(fiyatText.replace(',', '.')) || 0;
  } catch (e) {
    return 0;
  }
}

async function altinFiyatCek() {
  try {
    const response = await axios.get('https://doviz.com/altin', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(response.data);
    const sonuc = {};

    $('table tbody tr').each((i, el) => {
      const isim = $(el).find('td').first().text().trim();
      const alis = $(el).find('td').eq(1).text().trim().replace('.', '').replace(',', '.');
      const satis = $(el).find('td').eq(2).text().trim().replace('.', '').replace(',', '.');

      if (isim.includes('Has') || isim.includes('Gram')) sonuc['HAS'] = { alis: parseFloat(alis) || 0, satis: parseFloat(satis) || 0 };
      else if (isim.includes('Çeyrek')) sonuc['CEYREK'] = { alis: parseFloat(alis) || 0, satis: parseFloat(satis) || 0 };
      else if (isim.includes('Yarım')) sonuc['YARIM'] = { alis: parseFloat(alis) || 0, satis: parseFloat(satis) || 0 };
      else if (isim.includes('Tam') || isim.includes('Ziynet')) sonuc['TAM'] = { alis: parseFloat(alis) || 0, satis: parseFloat(satis) || 0 };
      else if (isim.includes('22')) sonuc['AYAR22'] = { alis: parseFloat(alis) || 0, satis: parseFloat(satis) || 0 };
      else if (isim.includes('14')) sonuc['AYAR14'] = { alis: parseFloat(alis) || 0, satis: parseFloat(satis) || 0 };
      else if (isim.includes('Ons') || isim.includes('ONS')) sonuc['ONS'] = { alis: parseFloat(alis) || 0, satis: parseFloat(satis) || 0 };
    });

    return sonuc;
  } catch (e) {
    return {};
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const [altin, tlyFiyat, pheFiyat] = await Promise.all([
      altinFiyatCek(),
      fonFiyatCek('TLY'),
      fonFiyatCek('PHE')
    ]);

    res.status(200).json({
      basarili: true,
      veri: {
        altin,
        fonlar: {
          TLY: { fiyat: tlyFiyat },
          PHE: { fiyat: pheFiyat }
        }
      }
    });

  } catch (e) {
    res.status(500).json({ basarili: false, hata: e.message });
  }
};
