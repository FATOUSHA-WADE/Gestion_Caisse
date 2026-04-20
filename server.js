import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('NODE_ENV:', NODE_ENV);

// Check SMTP variables specifically
const smtpVars = {};
for (const [key, value] of Object.entries(process.env)) {
  if (key.toLowerCase().includes('smtp')) {
    smtpVars[key] = key.toLowerCase().includes('pass') ? (value ? 'SET' : 'NOT SET') : value;
  }
}
console.log('SMTP variables:', JSON.stringify(smtpVars));


app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
