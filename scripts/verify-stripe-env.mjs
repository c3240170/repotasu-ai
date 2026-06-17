import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
dotenv.config({ path: envPath });

console.log('.env の場所:', envPath, fs.existsSync(envPath) ? 'あり' : 'なし');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '読めている' : '空');
console.log('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID ? '読めている' : '空');
