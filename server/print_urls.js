const axios = require('axios');

async function run() {
  try {
    console.log('Downloading live JS bundle...');
    const res = await axios.get('https://www.gpsfdk.com/assets/index-CPbvMzOR.js');
    const js = res.data;
    console.log('Downloaded successfully! Extracting all HTTP/HTTPS URLs...');
    
    // Find all urls starting with http:// or https://
    const regex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}[a-zA-Z0-9.\/_-]*/g;
    const matches = js.match(regex);
    if (matches) {
      const uniqueUrls = [...new Set(matches)];
      console.log(`\nFound ${uniqueUrls.length} unique URLs:\n`);
      uniqueUrls.forEach(url => {
        // Filter out common library/font/icon urls to keep output focused on API/backend domains
        if (!url.includes('w3.org') && !url.includes('reactjs.org') && !url.includes('facebook') && !url.includes('googletagmanager')) {
          console.log(url);
        }
      });
    } else {
      console.log('No URLs found!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
