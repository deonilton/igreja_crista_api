# Ministry Leaders Module

Este módulo gerencia a atribuição de líderes aos ministérios da igreja.

## Funcionalidades

- **Gestão de Líderes**: Adicionar, editar e remover líderes de ministérios
- **Busca de Membros**: Autocomplete para busca rápida de membros
- **Validações**: Máximo 2 líderes por ministério, prevenção de duplicidade
- **Visualização**: Listar todos os ministérios com seus líderes

## Endpoints

### 1. Listar todos os ministérios com líderes
```
GET /api/ministries/leaders
```

**Response:**
```json
{
  "ministries": [
    {
      "id": "pequenas_familias",
      "name": "pequenas_familias",
      "display_name": "Pequenas Famílias",
      "description": "Grupos de pequenas famílias",
      "icon": "home",
      "is_active": true,
      "leaders": [
        {
          "id": 1,
          "ministry_id": "pequenas_familias",
          "member_id": 123,
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z",
          "member": {
            "id": 123,
            "full_name": "João Silva",
            "email": "joao@exemplo.com",
            "phone": "11999999999"
          }
        }
      ]
    }
  ],
  "total": 1
}
```

### 2. Listar líderes de um ministério específico
```
GET /api/ministries/{ministryId}/leaders
```

### 3. Adicionar líder a um ministério
```
POST /api/ministries/leaders
Content-Type: application/json

{
  "ministry_id": "pequenas_familias",
  "member_id": 123
}
```

### 4. Atualizar líder
```
PUT /api/ministries/leaders/{leaderId}
Content-Type: application/json

{
  "member_id": 456
}
```

### 5. Remover líder
```
DELETE /api/ministries/leaders/{leaderId}
```

### 6. Buscar membros (autocomplete)
```
GET /api/ministries/members/search?query=joao
```

### 7. Listar lideranças de um membro
```
GET /api/ministries/members/{memberId}/leaderships
```

## Validações

### Regras de Negócio
- ✅ Um ministério pode ter no mínimo 0 líderes
- ✅ Um ministério pode ter no máximo 2 líderes
- ✅ Um membro não pode ser líder do mesmo ministério mais de uma vez
- ✅ Apenas membros existentes podem ser atribuídos como líderes
- ✅ Apenas ministérios ativos podem receber líderes

### Códigos de Status
- `200` - Sucesso
- `201` - Criado com sucesso
- `204` - Removido com sucesso (no content)
- `400` - Requisição inválida
- `404` - Recurso não encontrado
- `409` - Conflito (duplicidade ou limite atingido)
- `500` - Erro interno do servidor

## Estrutura do Banco de Dados

### Tabela: ministry_leaders
```sql
CREATE TABLE ministry_leaders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ministry_id VARCHAR(50) NOT NULL,
  member_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ministry_member (ministry_id, member_id),
  
  INDEX idx_ministry_leaders_ministry_id (ministry_id),
  INDEX idx_ministry_leaders_member_id (member_id)
);
```

## Testes

### Teste 1: Listar ministérios
```bash
curl -X GET http://localhost:3001/api/ministries/leaders
```

### Teste 2: Adicionar líder
```bash
curl -X POST http://localhost:3001/api/ministries/leaders \
  -H "Content-Type: application/json" \
  -d '{"ministry_id": "pequenas_familias", "member_id": 1}'
```

### Teste 3: Buscar membros
```bash
curl -X GET "http://localhost:3001/api/ministries/members/search?query=joao"
```

## Dependências

- **MySQL**: Banco de dados relacional
- **Express**: Framework web
- **mysql2**: Driver MySQL para Node.js

## Notas

- Este módulo segue o padrão de arquitetura do projeto com Service, Controller e Routes separados
- Todas as operações são transactionais e incluem validações completas
- Os endpoints estão prontos para consumo pelo frontend React
