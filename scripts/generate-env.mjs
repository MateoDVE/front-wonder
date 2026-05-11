import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const apiUrl = process.env.NG_APP_API_URL || 'http://localhost:3000';
const outputPath = resolve(process.cwd(), 'public', 'env.js');

const content = `window.__env = { API_URL: '${apiUrl}' };\n`;
writeFileSync(outputPath, content, 'utf8');

console.log(`[front-wonder] env.js generated with API_URL=${apiUrl}`);
