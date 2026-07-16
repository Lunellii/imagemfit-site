# Imagem Fit Quadros

Código do catálogo online da [Imagem Fit Quadros](https://imagemfitquadros.com.br/).

O site reúne o portfólio por categorias e códigos. O cliente escolhe os quadros, monta uma seleção e compartilha as imagens e referências com o contato desejado. Também há um painel reservado para administrar categorias, imagens e a disponibilidade do catálogo.

## Desenvolvimento local

O projeto usa React, Vite e Tailwind CSS. Para rodar:

```bash
npm install
npm run dev
```

O Vite abre o catálogo em `http://localhost:5173/`. No ambiente local, categorias e imagens ficam salvas no próprio navegador.

Para testar o painel administrativo, copie `.env.example` para `.env` e preencha as credenciais indicadas no arquivo. A rota do painel é mantida na configuração interna do projeto.

## Armazenamento no servidor

Em produção, o frontend usa a API Node do projeto. As variáveis necessárias estão documentadas em `.env.hostinger.example`.

Os arquivos enviados pelo painel são gravados em `storage/uploads`. Categorias, imagens e demais dados do catálogo ficam em `storage/data`. O caminho pode ser alterado pela variável `IFQ_STORAGE_DIR`; na hospedagem, prefira um diretório persistente fora da pasta de cada deploy.

As imagens enviadas pelo painel são redimensionadas e convertidas para WebP antes do upload, reduzindo o peso sem comprometer a apresentação no catálogo.

## Comandos úteis

| Comando | Uso |
| --- | --- |
| `npm run dev` | Abre o frontend local |
| `npm run dev:app` | Inicia a aplicação pelo servidor Node |
| `npm run dev:api` | Inicia somente a API local de classificação |
| `npm run dev:secure` | Inicia frontend e API local juntos |
| `npm run build` | Gera a versão de produção em `dist` |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Verifica o código com ESLint |

## Publicação

O site oficial roda como uma aplicação Node.js na Hostinger. A hospedagem acompanha a branch `main` deste repositório e executa:

```text
Build: npm run build
Start: npm run start
```

As variáveis de produção devem ser configuradas no painel da Hostinger, nunca salvas no repositório. Isso inclui credenciais administrativas e `ADMIN_SESSION_SECRET`.

## Pastas principais

- `src/`: páginas, componentes e integração com os dados do catálogo
- `public/`: imagens e arquivos estáticos publicados com o site
- `server/`: servidor Node e endpoints privados
- `storage/`: dados locais usados pelo modo servidor
- `scripts/`: utilitários de desenvolvimento e importação
