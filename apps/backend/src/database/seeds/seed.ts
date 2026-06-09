import 'reflect-metadata';
import dataSource from '../../data-source';
import { seeders } from './index';

/** Standalone seed runner: `pnpm --filter backend seed`. Idempotent. */
async function main() {
  await dataSource.initialize();
  console.log('Seeding database...');
  try {
    for (const seeder of seeders) {
      process.stdout.write(`  - ${seeder.name} ... `);
      await seeder.run(dataSource);
      console.log('done');
    }
    console.log('Seeding complete.');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
