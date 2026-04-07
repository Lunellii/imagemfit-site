## Imagem Fit Quadros

Projeto React + Vite para catalogo de quadros com:
- vitrine publica por categorias
- novidades em carrossel
- carrinho local com envio de orcamento por WhatsApp
- painel administrativo para criar categorias e gerenciar imagens
- persistencia local em `localStorage`

### Rodar local (modo seguro)
1. Instale dependencias:
   - `npm install`
2. Configure acesso admin:
   - copie `.env.example` para `.env`
   - ajuste `VITE_ADMIN_EMAIL` e `VITE_ADMIN_PASSWORD`
   - para Google Login, defina `VITE_GOOGLE_CLIENT_ID` e `VITE_ADMIN_GOOGLE_EMAIL`
3. Configure IA visual segura (server-side):
   - copie `.env.server.example` para `.env.server`
   - defina `OPENAI_API_KEY` e opcional `OPENAI_MODEL`
4. Execute:
   - `npm run dev:secure`
5. Acesse:
   - `http://localhost:5173/admin`
   - `http://localhost:5173/admin/login`

### Scripts
- `npm run dev` - frontend Vite
- `npm run dev:api` - API privada local da classificacao IA
- `npm run dev:secure` - sobe frontend + API privada juntos
- `npm run build`
- `npm run preview`

### Custos da API
- uso/custos: `https://platform.openai.com/usage`
- limites/alertas: `https://platform.openai.com/settings/organization/limits`

### Seguranca
- a chave OpenAI fica somente no servidor local (`.env.server`), nunca no frontend
- a API de classificacao roda em `127.0.0.1` e aplica rate limit
- para producao, use autenticacao backend real e HTTPS
