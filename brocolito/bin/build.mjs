import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await build({ configFile: path.resolve(__dirname, '../vite.peer.config.ts') })
