import { postgresSequelize } from '../../db';
import { applyAssociations } from './associate';


applyAssociations();

// Sync all PostgreSQL models
export const syncPostgresModels = async () => {
  try {

     await postgresSequelize.sync({ alter: true });
    console.log('PostgreSQL models synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing PostgreSQL models:', error);
  }
};

export { postgresSequelize };

