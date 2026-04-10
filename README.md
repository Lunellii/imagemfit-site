## Imagem Fit Quadros

Projeto React + Vite para catalogo de quadros com:
- vitrine publica por categorias
- novidades em carrossel
- carrinho local com envio de orcamento por WhatsApp
- painel administrativo para criar categorias e gerenciar imagens
- persistencia local em `localStorage`

### Rodar local
1. Instale dependencias:
   - `npm install`
2. Configure admin:
   - copie `.env.example` para `.env`
   - ajuste `VITE_ADMIN_EMAIL` e `VITE_ADMIN_PASSWORD`
3. Execute:
   - `npm run dev`
4. Acesse:
   - site: `http://localhost:5173/`
   - admin: `http://localhost:5173/#/admingustavoif/login`

### Scripts
- `npm run dev` - frontend Vite
- `npm run dev:api` - API privada local da classificacao IA
- `npm run dev:secure` - sobe frontend + API privada juntos
- `npm run build`
- `npm run preview`

### Deploy na Hostinger (GitHub)
Use essas configuracoes no deploy:
- Framework: `Vite`
- Branch: `main`
- Node: `20.x`
- Root directory: `./`
- Build command: `npm run build -- --base=/`
- Output directory: `dist`

Variaveis de ambiente recomendadas:
- `VITE_ENABLE_ADMIN=true`
- `VITE_ADMIN_EMAIL=seu-email-admin`
- `VITE_ADMIN_PASSWORD=sua-senha-forte`

### Deploy no GitHub Pages
O workflow `.github/workflows/deploy-pages.yml` ja define `VITE_BASE_PATH=/imagemfit-site/` automaticamente para publicar em:
- `https://lunellii.github.io/imagemfit-site/`

### Seguranca
- Nunca subir `.env` e `.env.server` para o GitHub
- Em producao, use senha forte no admin
- Se quiser seguranca maxima para admin, migrar login para backend com sessao/JWT (nao somente `localStorage`)