# Dual Database Setup: MSSQL + PostgreSQL

This project now supports both MSSQL and PostgreSQL databases using Sequelize ORM.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# MSSQL Database Configuration (Existing)
DB_SERVER=localhost\\SQLEXPRESS
DB_NAME=your_mssql_database
DB_USER=your_mssql_username
DB_PASSWORD=your_mssql_password

# PostgreSQL Database Configuration (New)
POSTGRES_DB_HOST=localhost
POSTGRES_DB_PORT=5432
POSTGRES_DB_NAME=your_postgres_database
POSTGRES_DB_USER=your_postgres_username
POSTGRES_DB_PASSWORD=your_postgres_password
POSTGRES_DB_SSL=false
```

## Database Connections

### MSSQL Connection
- **File**: `src/db/index.ts`
- **Export**: `mssqlSequelize`
- **Usage**: For existing MSSQL models and operations

### PostgreSQL Connection
- **File**: `src/db/index.ts`
- **Export**: `postgresSequelize`
- **Usage**: For new PostgreSQL models and operations

## Models

### MSSQL Models
- **Location**: `src/models/` (existing)
- **Connection**: Uses `mssqlSequelize`
- **Example**: `Customer`, `Inventory`, etc.

### PostgreSQL Models
- **Location**: `src/models/postgres/`
- **Connection**: Uses `postgresSequelize`
- **Example**: `User` model

## API Endpoints

### PostgreSQL Operations
- `GET /api/dual-db/postgres/users` - Get all PostgreSQL users
- `POST /api/dual-db/postgres/users` - Create a new PostgreSQL user

### MSSQL Operations
- `GET /api/dual-db/mssql/customers` - Get all MSSQL customers

### Cross-Database Operations
- `GET /api/dual-db/both` - Get data from both databases
- `POST /api/dual-db/transaction` - Perform cross-database transaction

## Usage Examples

### Creating a PostgreSQL Model

```typescript
import { DataTypes, Model, Optional } from 'sequelize';
import { postgresSequelize } from '../../db';

interface ProductAttributes {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public price!: number;
  public category!: string;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize: postgresSequelize,
    tableName: 'products',
    timestamps: true,
  }
);
```

### Using Both Databases in a Service

```typescript
import { mssqlSequelize, postgresSequelize } from '../db';
import { User } from '../models/postgres';
import { Customer } from '../models/customer.model';

export class DualDatabaseService {
  async getDataFromBothDatabases() {
    const [postgresUsers, mssqlCustomers] = await Promise.all([
      User.findAll(),
      Customer.findAll()
    ]);

    return {
      postgresUsers,
      mssqlCustomers
    };
  }
}
```

## Important Notes

1. **Separate Connections**: Each database has its own Sequelize instance
2. **Model Separation**: MSSQL and PostgreSQL models are kept separate
3. **Transactions**: Cross-database transactions require special handling
4. **Connection Testing**: Both connections are tested on startup
5. **Model Synchronization**: Both databases sync their models on startup

## Troubleshooting

### Connection Issues
- Ensure both databases are running
- Check environment variables are correctly set
- Verify network connectivity to both databases

### Model Issues
- Ensure models are imported in the correct index files
- Check that models use the correct Sequelize instance
- Verify table names and column definitions

### Performance
- Use `Promise.all()` for concurrent database operations
- Consider connection pooling for high-traffic applications
- Monitor query performance on both databases 