# Estrutura da API - Igreja Cristã

## Arquitetura Modular

A API foi organizada seguindo uma arquitetura modular, separando responsabilidades por domínio de negócio.

```
src/
├── modules/                 # Módulos de domínio
│   ├── auth/               # Autenticação
│   │   ├── auth.types.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── auth.routes.ts
│   ├── users/              # Gerenciamento de usuários
│   │   ├── users.types.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── users.routes.ts
│   ├── members/            # Gerenciamento de membros
│   │   ├── members.types.ts
│   │   ├── members.service.ts
│   │   ├── members.controller.ts
│   │   └── members.routes.ts
│   ├── dashboard/          # Dashboard e estatísticas
│   │   ├── dashboard.types.ts
│   │   ├── dashboard.service.ts
│   │   ├── dashboard.controller.ts
│   │   └── dashboard.routes.ts
│   └── public/             # Rotas públicas
│       ├── public.types.ts
│       ├── public.service.ts
│       ├── public.controller.ts
│       └── public.routes.ts
├── shared/                  # Recursos compartilhados
│   ├── database/           # Conexão com banco
│   │   └── connection.ts
│   ├── middlewares/        # Middlewares globais
│   │   ├── auth.middleware.ts
│   │   └── role.middleware.ts
│   └── utils/              # Utilitários
├── config/                 # Configurações
├── server.ts              # Entry point
└── seed.ts                # Seed de dados
```

## Responsabilidades

### Types (`*.types.ts`)
Define as interfaces e tipos TypeScript do módulo.

### Service (`*.service.ts`)
Contém a lógica de negócio e acesso ao banco de dados.
- Regras de negócio
- Validações
- Queries SQL
- Manipulação de dados

### Controller (`*.controller.ts`)
Recebe as requisições HTTP e delega para o service.
- Tratamento de request/response
- Validação de entrada
- HTTP status codes
- Chama o service apropriado

### Routes (`*.routes.ts`)
Define as rotas e middlewares específicos.
- Mapeamento de URLs
- Aplicação de middlewares
- Delegação para controllers

## Convenções

1. **Cada módulo é independente** - Não importe de outros módulos diretamente
2. **Shared é para recursos comuns** - Database, middlewares, utilitários
3. **Tipos sempre definidos** - Cada módulo tem seus próprios types
4. **Services são singletons** - Exporta uma instância única
5. **Controllers são singletons** - Exporta uma instância única

## Adicionar novo módulo

Para criar um novo módulo (ex: `events`):

1. Criar pasta `src/modules/events/`
2. Criar os 4 arquivos:
   - `events.types.ts` - Interfaces
   - `events.service.ts` - Regras de negócio
   - `events.controller.ts` - Handlers HTTP
   - `events.routes.ts` - Definição de rotas
3. Importar no `server.ts`:
   ```typescript
   import eventsRoutes from './modules/events/events.routes';
   app.use('/api/events', eventsRoutes);
   ```

## Middlewares

### authMiddleware
Verifica JWT e adiciona `userId`, `userRole`, `userMinistries` ao request.

### checkSuperAdmin
Permite apenas super_admin.

### checkMinistryAccess(ministry)
Permite apenas usuários com acesso ao ministério específico.
