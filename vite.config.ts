import {defineConfig,loadEnv,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath,URL} from 'node:url';

function googleVerificationMeta(value:string):Plugin{
  return{name:'timeforge-google-verification',transformIndexHtml(html){const token=value.trim();const meta=/<meta name="google-site-verification" content="%VITE_GOOGLE_SITE_VERIFICATION%"\/>/;return token?html.replace(meta,`<meta name="google-site-verification" content="${token.replace(/["<>]/g,'')}"/>`):html.replace(meta,'')}};
}

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  return{
    plugins:[googleVerificationMeta(env.VITE_GOOGLE_SITE_VERIFICATION||''),react(),tailwindcss()],
    resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},
    server:{
      host:'0.0.0.0',
      allowedHosts:['timeforge.local','terminal.local'],
      watch:{ignored:['**/.sites-runtime/**','**/dist/**']},
    },
    build:{
      target:'es2022',
      cssCodeSplit:true,
      cssMinify:'lightningcss',
    },
  };
});
