## Imagem Fit Quadros

Projeto React + Vite com painel administrativo e dois modos de armazenamento:
- `local` (padrao): dados no `localStorage` do navegador
- `server`: dados e imagens salvos no servidor (Hostinger)

### Acesso admin
- Login: `/#/admingustavoif/login`

### Rodar local (modo localStorage)
1. Instale dependencias: `npm install`
2. Copie `.env.example` para `.env`
3. Ajuste `VITE_ADMIN_EMAIL` e `VITE_ADMIN_PASSWORD`
4. Execute: `npm run dev`
5. Acesse:
- site: `http://localhost:5173/`
- admin: `http://localhost:5173/#/admingustavoif/login`

### Rodar com armazenamento em servidor (Node)
1. Gere build: `npm run build`
2. Configure variaveis de ambiente:
- `VITE_STORAGE_MODE=server`
- `VITE_ENABLE_ADMIN=true`
- `VITE_ADMIN_EMAIL=seu-email-admin`
- `VITE_ADMIN_PASSWORD=sua-senha-forte`
- `ENABLE_ADMIN=true`
- `ADMIN_EMAIL=seu-email-admin`
- `ADMIN_PASSWORD=sua-senha-forte`
- `ADMIN_SESSION_SECRET=chave-longa-aleatoria`
- `IFQ_STORAGE_DIR=./storage` (opcional)
3. Inicie servidor: `npm run start`

No modo `server`, arquivos enviados no admin vao para:
- imagens: `storage/uploads`
- metadados: `storage/data/categories.json` e `storage/data/images.json`
- uploads sao otimizados automaticamente no navegador (WebP com compressao adaptativa) para manter boa qualidade com menor peso.

### Deploy Hostinger (Web App Node.js)
Use:
- Framework: `Vite`
- Branch: `main`
- Node: `20.x` (ou superior suportado)
- Diretorio raiz: `./`
- Comando de build: `npm run build`
- Comando de start: `npm run start`

Adicione as variaveis acima no painel da Hostinger para ativar o modo `server`.

### Scripts
- `npm run dev` - frontend Vite
- `npm run dev:api` - API privada local de classificacao IA
- `npm run dev:app` - servidor Node da aplicacao
- `npm run dev:secure` - frontend + API privada local
- `npm run build`
- `npm run start`
- `npm run preview`

### Seguranca
- Nunca subir `.env` para o GitHub.
- Use senha forte e `ADMIN_SESSION_SECRET` longo.
- Troque imediatamente qualquer chave/token exposto.

<!-- deploy-check: 2026-04-14T15:02:00-03:00 -->
