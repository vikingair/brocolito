import { resolve } from 'path';
import { readFileSync } from 'fs';
import { defineConfig, UserConfig } from 'vite';

const packageJSON = JSON.parse(readFileSync('package.json', 'utf-8'));

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/brocolito.ts'),
            fileName: (format) => `brocolito.${format === 'cjs' ? 'cjs' : 'mjs'}`,
            formats: ['cjs', 'es'],
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            external: Object.keys(packageJSON.dependencies),
        },
    },
});
