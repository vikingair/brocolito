import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'MyLib',
            fileName: (format) => `index.${format}.js`,
            formats: ['cjs'],
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            // external: ['vue', 'vuex'],
            output: {
                dir: 'build',
            },
        },
    },
});
