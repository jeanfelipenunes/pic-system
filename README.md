# 💡 PIC — Programa de Ideias Criativas

Plataforma corporativa interna para gestão de ideias dos colaboradores.

---

## 🚀 Como Rodar

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

### 1. Subir com Docker

```bash
docker-compose up -d
```

Aguarde cerca de 30–60 segundos na primeira execução (build + migrations + seed).

Acesse: **http://localhost:3000**

---

## 🔑 Credenciais de Desenvolvimento

| Email | Senha | Role |
|-------|-------|------|
| admin@pic.local | 123456 | admin |
| gestor@pic.local | 123456 | gestor |
| executor@pic.local | 123456 | executor |
| usuario@pic.local | 123456 | usuario |

> Disponíveis apenas quando `NODE_ENV=development`

---

## ⚙️ Configuração

Edite as variáveis de ambiente no `docker-compose.yml`:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_SECRET` | Segredo JWT (troque em produção) |
| `NEXTAUTH_SECRET` | Segredo NextAuth (troque em produção) |
| `LDAP_URL` | URL do servidor LDAP/AD |
| `LDAP_BASE_DN` | Base DN do Active Directory |
| `LDAP_BIND_USER` | Usuário de bind LDAP |
| `LDAP_BIND_PASSWORD` | Senha do usuário de bind |
| `AI_PROVIDER` | `openai` ou `gemini` |
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `GEMINI_API_KEY` | Chave da API Gemini |
| `SMTP_HOST` | Host do servidor SMTP |
| `SMTP_PORT` | Porta SMTP (padrão: 587) |
| `SMTP_USER` | Usuário/email SMTP |
| `SMTP_PASSWORD` | Senha SMTP |

---

## 🏗️ Arquitetura

```
pic-system/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes (backend)
│   │   ├── auth/           # NextAuth
│   │   ├── ideas/          # CRUD ideias + votos/comentários
│   │   ├── users/          # Usuários
│   │   ├── departments/    # Departamentos
│   │   ├── tags/           # Tags
│   │   ├── statuses/       # Status
│   │   ├── notifications/  # Notificações
│   │   ├── reports/        # Relatórios
│   │   ├── ai/             # Integração IA
│   │   └── admin/          # Administração
│   ├── dashboard/          # Dashboard principal
│   ├── ideas/              # Lista e detalhe de ideias
│   ├── evaluation/         # Avaliação (gestores)
│   ├── execution/          # Execução (executores)
│   ├── reports/            # Relatórios
│   └── admin/              # Painel administrativo
├── components/             # Componentes React reutilizáveis
├── lib/                    # Utilitários (prisma, auth, ldap, mail, ai)
├── prisma/                 # Schema e seed do banco
├── docker-compose.yml      # Orquestração Docker
└── Dockerfile              # Build da aplicação
```

### Stack
- **Frontend/Backend**: Next.js 14 (App Router + API Routes)
- **Banco de dados**: PostgreSQL 15
- **ORM**: Prisma
- **Autenticação**: NextAuth.js (JWT + LDAP)
- **Estilo**: Tailwind CSS
- **IA**: OpenAI GPT / Google Gemini
- **Email**: Nodemailer (compatível com Exchange Online)

---

## 🔄 Funcionalidades

- ✅ Login via LDAP/AD (ou local em desenvolvimento)
- ✅ Cadastro e gestão de ideias
- ✅ Sistema de votação mensal (limite configurável)
- ✅ Sistema de pontuação e ranking
- ✅ Fluxo de avaliação por gestores
- ✅ Execução e acompanhamento de implementações
- ✅ Notificações internas + email
- ✅ Assistente de IA para criação e análise
- ✅ Relatórios com análise por IA
- ✅ Painel administrativo completo
- ✅ Sincronização com Active Directory

---

## 🛑 Parar o sistema

```bash
docker-compose down
```

Para remover os dados do banco:
```bash
docker-compose down -v
```

---

## 🔧 Desenvolvimento Local (sem Docker)

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Rodar migrations
npx prisma migrate dev

# Rodar seed
node prisma/seed.js

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000
