# VelvetStream API

Bem-vindo à **VelvetStream API** – um backend completo para gerenciamento de filmes, séries, assinaturas, pagamentos, listas de favoritos, avaliações, streaming de vídeos e um painel administrativo para controle do sistema.

## 1. Visão Geral

A API foi desenvolvida utilizando **Node.js** e **Express**, seguindo um padrão RESTful.  
Ela fornece endpoints para:

- Autenticação e gerenciamento de contas (registro, login, recuperação de senha, etc.)
- Exploração de conteúdo (filmes e séries com temporadas e episódios)
- Player e streaming de vídeos (com URLs seguras via BunnyCDN e controle de progresso)
- Gerenciamento de listas e avaliações
- Integração com Mercado Pago para pagamentos e assinaturas
- Painel administrativo para gerenciamento geral (usuários, conteúdo, pagamentos, etc.)
- Segurança adicional com JWT, RBAC, Rate Limiting, Helmet e Turnstile (Cloudflare)

## 2. Requisitos e Instalação

### Requisitos

- **Node.js** (v14 ou superior recomendado)
- **npm** (ou yarn)

### Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/velvetstream-api.git
   cd velvetstream-api
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   Crie um arquivo `.env` na raiz do projeto e defina as seguintes variáveis:

   ```env
   PORT=3000
   NODE_ENV=development

   # Banco de Dados (Cloudflare D1)
   D1_URL=...
   D1_AUTH=...

   # JWT
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...

   # Turnstile Cloudflare
   TURNSTILE_SITE_KEY=...
   TURNSTILE_SECRET=...

   # Mercado Pago
   MP_ACCESS_TOKEN=...

   # Reset de Senha
   JWT_RESET_SECRET=...
   JWT_RESET_EXPIRES_IN=1h
   ```

## 3. Execução do Projeto

Para rodar em modo de desenvolvimento (usando nodemon):

```bash
npm run dev
```

Para rodar em produção:

```bash
npm start
```

A API estará disponível em http://localhost:3000.

## 4. Estrutura de Pastas

```
velvetstream/
├─ src/
│  ├─ controllers/       # Lógica de cada recurso (Auth, Payment, Player, etc.)
│  ├─ middleware/        # Middlewares de autenticação, rate limiting, etc.
│  ├─ models/            # Conexão com o banco e funções de query
│  ├─ routes/            # Definição dos endpoints (ex.: authRoutes, contentRoutes, adminRoutes, etc.)
│  ├─ app.js             # Configuração principal do Express e middlewares
│  └─ server.js          # Ponto de entrada do servidor
├─ .env
├─ package.json
├─ README.md
└─ ...
```

## 5. Funcionalidades Principais

### 5.1 Autenticação e Conta (`/auth`)

**POST /auth/register**
Registra um novo usuário.
Exemplo de Payload:

```json
{
  "name": "Fulano de Tal",
  "email": "fulano@example.com",
  "password": "suaSenha",
  "cf-turnstile-response": "testToken"
}
```

**POST /auth/login**
Autentica o usuário e retorna accessToken e refreshToken.
Exemplo de Payload:

```json
{
  "email": "fulano@example.com",
  "password": "suaSenha",
  "cf-turnstile-response": "testToken"
}
```

**POST /auth/refresh-token**
Atualiza o accessToken utilizando o refreshToken.

**POST /auth/forgot-password**
Gera um token para recuperação de senha.
Exemplo de Payload:

```json
{ "email": "fulano@example.com" }
```

**POST /auth/reset-password**
Reseta a senha utilizando o token de recuperação.
Exemplo de Payload:

```json
{
  "token": "<resetToken>",
  "newPassword": "novaSenha"
}
```

**DELETE /auth/delete**
Exclui o usuário (envia o email no payload).

**POST /auth/logout**
Realiza o logout (geralmente, o front-end remove o token).

### 5.2 Conteúdo – Filmes e Séries (`/content`)

**Filmes (Tabela videos)**

**GET /content/movies**
Lista os filmes recentes (ex.: os 10 mais recentes).

**GET /content/movies/search?query=...**
Pesquisa filmes pelo título.

**GET /content/movies/:id**
Retorna os detalhes de um filme.

**Séries (Tabelas series, seasons e episodes)**

**GET /content/series**
Lista todas as séries.

**GET /content/series/:id**
Retorna os detalhes de uma série.

**GET /content/series/:id/seasons**
Lista as temporadas de uma série (realiza JOIN para obter o título da série).

**GET /content/series/:id/episodes?season=X**
Lista os episódios da série; se season for especificado, filtra por temporada.

### 5.3 Player e Streaming (`/player`)

**GET /player/:id**
Retorna uma URL segura para o vídeo (gerada via BunnyCDN).

**POST /player/progress**
Salva o progresso de visualização do usuário (tempo assistido).

**GET /player/progress/:id?user_id=...**
Retorna o progresso salvo para um vídeo específico.

### 5.4 Minha Lista (`/lists`)

**POST /lists**
Adiciona um vídeo à lista de favoritos do usuário.
Exemplo de Payload:

```json
{
  "user_id": "user123",
  "video_id": "<VIDEO_ID>"
}
```

**GET /lists/:user_id**
Lista todos os vídeos salvos na lista do usuário.

**DELETE /lists/:user_id/:video_id**
Remove um vídeo da lista.

### 5.5 Avaliações e Curtidas (`/ratings`)

**POST /ratings**
Adiciona ou atualiza uma avaliação para um vídeo.
Exemplo de Payload:

```json
{
  "user_id": "user123",
  "video_id": "<VIDEO_ID>",
  "rating": 4.5,
  "like": true,
  "comment": "Muito bom!"
}
```

**GET /ratings/:video_id**
Retorna as avaliações e a média de ratings de um vídeo.

### 5.6 Pagamentos e Assinaturas (`/api/payments`)

**POST /api/payments/create_preference**
Cria uma preferência de pagamento no Mercado Pago.

**GET /api/payments/success**
Endpoint chamado após pagamento aprovado (atualiza status para "active").

**GET /api/payments/pending**
Endpoint para pagamentos pendentes.

**GET /api/payments/failure**
Endpoint para pagamentos falhos.

**POST /api/payments/cancel**
Cancela a assinatura (atualiza status para "pending").

### 5.7 Painel Administrativo (`/admin`)

Protegido por autenticação JWT e RBAC (apenas usuários com role = "admin" podem acessar).

**Gerenciamento Geral**

**GET /admin/dashboard**
Retorna estatísticas básicas (usuários, filmes, pagamentos).

**GET /admin/users**
Lista todos os usuários.

**PUT /admin/users/:id**
Atualiza a role de um usuário.

**DELETE /admin/users/:id**
Exclui um usuário.

**GET /admin/payments**
Lista o histórico de pagamentos.

**PUT /admin/payments/:id**
Atualiza o status de um pagamento.

**Filmes (Admin)**

**POST /admin/movies**
Cria um novo filme (o campo type deve ser "movie").

**PUT /admin/movies/:id**
Atualiza um filme.

**DELETE /admin/movies/:id**
Exclui um filme.

**Séries, Temporadas e Episódios (Admin)**

**POST /admin/series**
Cria uma nova série.

**GET /admin/series**
Lista todas as séries.

**GET /admin/series/:id**
Retorna os detalhes de uma série.

**PUT /admin/series/:id**
Atualiza uma série.

**DELETE /admin/series/:id**
Exclui uma série (com ON DELETE CASCADE, as temporadas e episódios serão excluídos automaticamente).

**POST /admin/series/:series_id/seasons**
Cria uma nova temporada para uma série.

**PUT /admin/seasons/:id**
Atualiza uma temporada.

**DELETE /admin/seasons/:id**
Exclui uma temporada.

**POST /admin/seasons/:season_id/episodes**
Cria um novo episódio para uma temporada (a tabela de episódios utiliza season_id como chave estrangeira).

**PUT /admin/episodes/:id**
Atualiza um episódio.

**DELETE /admin/episodes/:id**
Exclui um episódio.

**GET /admin/seasons/:season_id/episodes**
Lista todos os episódios de uma temporada.

## 6. Exemplo de Uso com cURL

### 6.1 Health Check

```bash
curl -X GET http://localhost:3000/v1/health
```

### 6.2 Registro de Usuário

```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fulano de Tal",
    "email": "fulano@example.com",
    "password": "suaSenha",
    "cf-turnstile-response": "testToken"
  }'
```

### 6.3 Login

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fulano@example.com",
    "password": "suaSenha",
    "cf-turnstile-response": "testToken"
  }'
```

### 6.4 Criar Filme (Admin)

```bash
curl -X POST http://localhost:3000/v1/admin/movies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "title": "Example Movie",
    "description": "Um filme de ação",
    "category": "Action",
    "type": "movie",
    "poster_url": "https://exemplo.com/poster.jpg",
    "video_url": "https://exemplo.com/video.mp4"
  }'
```

### 6.5 Criar Série (Admin)

```bash
curl -X POST http://localhost:3000/v1/admin/series \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "title": "Example Series",
    "description": "Série de teste",
    "poster_url": "https://exemplo.com/series-poster.jpg"
  }'
```

### 6.6 Criar Temporada para uma Série (Admin)

```bash
curl -X POST http://localhost:3000/v1/admin/series/<SERIES_ID>/seasons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "season_number": 1,
    "title": "Season 1",
    "description": "Descrição da temporada 1"
  }'
```

### 6.7 Criar Episódio para uma Temporada (Admin)

```bash
curl -X POST http://localhost:3000/v1/admin/seasons/<SEASON_ID>/episodes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "episode_number": 1,
    "title": "Episode 1",
    "description": "Descrição do episódio 1",
    "video_url": "https://exemplo.com/episode1.mp4",
    "duration": 3600
  }'
```

### 6.8 Obter Progresso do Vídeo

```bash
curl -X GET "http://localhost:3000/v1/player/progress/<VIDEO_ID>?user_id=user123"
```

(Substitua `<VIDEO_ID>`, `<SERIES_ID>`, `<SEASON_ID>`, `<admin_token>`, etc., pelos valores reais.)

## 7. Segurança e Middlewares

**Autenticação com JWT:**
Todas as rotas protegidas utilizam o middleware `authenticateToken` que decodifica o token e disponibiliza `req.user`.

**RBAC (Admin Only):**
As rotas administrativas utilizam o middleware `adminOnly` para garantir que apenas usuários com `role = "admin"` tenham acesso.

**Turnstile Cloudflare:**
Endpoints de autenticação e recuperação de senha são protegidos pelo middleware que valida o `cf-turnstile-response`.

**Rate Limiting e Helmet:**
São aplicados globalmente para aumentar a segurança da API.

## 8. Conclusão

Esta API permite a criação e gestão de conteúdos (filmes e séries com temporadas e episódios), gerenciamento de usuários e pagamentos, e oferece um painel administrativo completo.
Com a documentação e exemplos fornecidos, qualquer desenvolvedor (inclusive júnior) pode compreender e integrar a API em qualquer front-end (web, mobile ou desktop).

## Contribuição

1. Faça um fork deste repositório.
2. Crie uma branch para suas alterações.
3. Envie um Pull Request com suas contribuições.
4. Para reportar bugs ou sugerir melhorias, abra uma issue neste repositório.

