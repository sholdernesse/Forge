import { spawn, spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const corepack = isWindows ? 'corepack.cmd' : 'corepack';
const developmentEnvironment = {
  ...process.env,
  DATABASE_URL: 'postgresql://forge:forge-local-only@localhost:5432/forge',
  DATABASE_SSL: 'disable',
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function databaseReady() {
  const result = spawnSync('docker', ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'forge', '-d', 'forge'], { stdio: 'ignore' });
  return result.status === 0;
}

run('docker', ['compose', 'stop', 'api']);
run('docker', ['compose', 'up', '-d', 'postgres']);

for (let attempt = 1; attempt <= 30 && !databaseReady(); attempt += 1) {
  if (attempt === 30) {
    console.error('Forge PostgreSQL did not become ready. Run `docker compose logs postgres` for details.');
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}

run(corepack, ['pnpm', '--filter', '@forge/api', 'build'], { env: developmentEnvironment });
run(corepack, ['pnpm', '--filter', '@forge/api', 'migrate'], { env: developmentEnvironment });

const development = spawn(corepack, ['pnpm', '--parallel', '--filter', '@forge/api', '--filter', '@forge/web', 'dev:https'], {
  stdio: 'inherit',
  env: developmentEnvironment,
});
development.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
development.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
