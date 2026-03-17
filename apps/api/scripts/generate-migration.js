const { execSync } = require('child_process');

const name = process.argv[2];

if (!name) {
  console.error('\x1b[31mError: Please provide a migration name. \x1b[0m');
  console.log('Usage: yarn migration:generate <Migration Name>');
  process.exit(1);
}

const migrationPath = `src/database/migrations/${name}`;
try {
  console.log(`Generating migration:
    ${migrationPath}...`);
  execSync(`yarn typeorm migration:generate ${migrationPath}`, {
    stdio: 'inherit',
  });
} catch (error) {
  console.log('something went wrong please try again.');
  process.exit(1);
}
