const axios = require('axios');

async function run() {
  try {
    console.log('Downloading live JS bundle...');
    const res = await axios.get('https://www.gpsfdk.com/assets/index-CPbvMzOR.js');
    const js = res.data;
    console.log('Downloaded successfully! Searching for URL patterns...');
    
    const regexes = [
      /https?:\/\/[a-zA-Z0-9.-]+\.onrender\.com[a-zA-Z0-9.\/-]*/g,
      /https?:\/\/[a-zA-Z0-9.-]+\.on\.aws[a-zA-Z0-9.\/-]*/g,
      /https?:\/\/[a-zA-Z0-9.-]+\.run\.app[a-zA-Z0-9.\/-]*/g,
      /https?:\/\/[a-zA-Z0-9.-]+\.com\/api[a-zA-Z0-9.\/-]*/g,
      /https?:\/\/[a-zA-Z0-9.-]+\.com\/sitemap[a-zA-Z0-9.\/-]*/g
    ];
    
    regexes.forEach((regex, idx) => {
      const matches = js.match(regex);
      if (matches) {
        console.log(`\nMatches for Regex ${idx + 1}:`);
        console.log([...new Set(matches)]);
      }
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
