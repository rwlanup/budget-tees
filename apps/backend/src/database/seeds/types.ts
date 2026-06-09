import { DataSource } from 'typeorm';

/** A named, idempotent seeding unit. Runs in registration order. */
export interface Seeder {
  name: string;
  run(dataSource: DataSource): Promise<void>;
}
