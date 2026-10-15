import {build} from 'esbuild';
await build({entryPoints:['src/handlers/api.ts','src/handlers/worker.ts','src/handlers/line.ts','src/handlers/seed.ts'],outdir:'dist',bundle:true,platform:'node',target:'node24',format:'esm',outExtension:{'.js':'.mjs'},banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"},sourcemap:true});
