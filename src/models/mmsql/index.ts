import { sequelize } from '../../db';
import { applyAssociations } from './associate';

applyAssociations();

export { sequelize };

