const mongoose = require('mongoose');
const dns = require('dns');

// Some local resolvers (Windows + certain ISP/router DNS) refuse SRV/TXT
// queries, so `mongodb+srv://` URIs fail with `querySrv ECONNREFUSED` even
// though normal browsing works. Public resolvers answer SRV fine, so retry
// once with them before giving up. Regular A-record lookups still go through
// the OS resolver (dns.lookup), so this only affects SRV/TXT resolution.
const SRV_DNS_ERROR = /querySrv|queryTxt|ECONNREFUSED|ESERVFAIL|ETIMEOUT/i;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (SRV_DNS_ERROR.test(error.message)) {
      console.warn('MongoDB DNS (SRV) lookup failed via system DNS — retrying with public DNS 8.8.8.8/1.1.1.1...');
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected (via public DNS): ${conn.connection.host}`);
        return;
      } catch (retryError) {
        console.error(`MongoDB Error after public-DNS retry: ${retryError.message}`);
        process.exit(1);
      }
    }
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
