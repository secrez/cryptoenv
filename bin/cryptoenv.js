#!/usr/bin/env node

const pkg = require("../package");
const CryptoEnv = require("../src/CryptoEnv");

const [, , cmd, param] = process.argv;

const options = {};

if ((cmd === "--new" || cmd === "-n") && param.length > 0) {
  options.newKey = param.toUpperCase();
} else if (cmd === "--list" || cmd === "-l") {
  options.list = true;
}

if (Object.keys(options).length === 0) {
  console.info(`

Welcome to CryptoEnv v${pkg.version}
Manage encrypted env variable in CLI applications like eating candies

For help look at
https://github.com/secrez/cryptoenv#readme

Options:
  -n, --new  [key name]       Add a new key
  -l, --list                  List the keys' names
`);

  // eslint-disable-next-line no-process-exit
  process.exit(0);
}

async function main() {
  options.cli = true;
  const cryptoenv = new CryptoEnv(options);
  try {
    await cryptoenv.run();
  } catch (e) {
    console.log(e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
