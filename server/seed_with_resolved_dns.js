const dns = require('dns').promises;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

async function run() {
  const resolver = new dns.Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
  
  try {
    console.log('Resolving MongoDB SRV records...');
    const srv = await resolver.resolveSrv('_mongodb._tcp.cluster0.bmctuyz.mongodb.net');
    const txt = await resolver.resolveTxt('cluster0.bmctuyz.mongodb.net');
    
    const hosts = srv.map(record => `${record.name}:${record.port}`).join(',');
    const txtOptions = txt.flat().join('&');
    
    // Construct standard connection string
    const options = [];
    if (txtOptions) options.push(txtOptions);
    if (!txtOptions.includes('ssl=')) options.push('ssl=true');
    const optionsStr = options.length > 0 ? `?${options.join('&')}` : '';
    const resolvedUri = `mongodb://suraj:surajdb@${hosts}/ecommerce${optionsStr}`;
    console.log('Successfully resolved SRV records. Connection string constructed.');
    
    // Set MONGO_URI
    process.env.MONGO_URI = resolvedUri;
    
    // Now run seed.js logic
    console.log('Running seed.js...');
    require('./seed.js');
  } catch (err) {
    console.error('Failed to resolve MongoDB SRV records via public DNS:', err);
    process.exit(1);
  }
}

run();
