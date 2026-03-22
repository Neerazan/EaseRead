const { execFileSync } = require('child_process');

const name = process.argv[2];

if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
  console.error(
    '\x1b[31mError: Please provide a valid migration name (alphanumeric, dashes, underscores only). \x1b[0m',
  );
  console.log('Usage: yarn migration:generate <Migration Name>');
  process.exit(1);
}

const migrationPath = `src/database/migrations/${name}`;
try {
  console.log(`Generating migration:\n    ${migrationPath}...`);
  execFileSync('yarn', ['typeorm', 'migration:generate', migrationPath], {
    stdio: 'inherit',
  });
} catch (error) {
  console.log('something went wrong please try again.');
  process.exit(1);
}
