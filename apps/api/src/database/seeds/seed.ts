import { DataSource } from 'typeorm';
import { seedBuiltinTools } from './builtin-tools.seed';

export async function runSeeds(dataSource: DataSource) {
  await seedBuiltinTools(dataSource);
  console.log('All seeds completed');
}
