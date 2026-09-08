import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import {defineConfig} from 'vite';
// Local study: no hosted bindings, account registration, or remote storage.
export default defineConfig({
 css:{postcss:{plugins:[tailwindcss()]}},
 server:{host:'127.0.0.1',port:4173,strictPort:true,watch:{useFsEvents:false,usePolling:true}},
 plugins:[vinext()],
});
