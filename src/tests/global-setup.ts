import { execSync } from 'child_process';
import path from 'path';

export default function setup() {
  const backendRoot = path.resolve(__dirname, '../..');
  const sequelizeCli = path.resolve(backendRoot, 'node_modules/sequelize-cli/lib/sequelize');
  // Ensure the shared test database schema matches the latest migrations.
  execSync(`"${process.execPath}" "${sequelizeCli}" db:migrate --env test`, {
    cwd: backendRoot,
    stdio: 'inherit'
  });
}