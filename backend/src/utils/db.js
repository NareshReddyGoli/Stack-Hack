const mongoose = require('mongoose');

let isConnected = false;

async function connectToDatabase(uri) {
  if (isConnected) return;
  if (!uri) throw new Error('MONGODB_URI is not set');
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
  } catch (err) {
    const message = String(err?.message || err);
    const isSrvDnsError = message.includes('querySrv ENOTFOUND') && uri.startsWith('mongodb+srv://');
    if (isSrvDnsError) {
      // Fallback to classic connection string if SRV lookup fails
      const alt = process.env.MONGO_URI_FALLBACK || 'mongodb://localhost:27017/stack_hack';
      // eslint-disable-next-line no-console
      console.warn(`[DB] SRV lookup failed for primary MONGO_URI. Falling back to ${alt}`);
      await mongoose.connect(alt);
    } else {
      throw err;
    }
  }
  isConnected = true;
  // eslint-disable-next-line no-console
  console.log('mongodb connected');
}

module.exports = { connectToDatabase };


