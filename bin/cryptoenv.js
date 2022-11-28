#!/usr/bin/env node
const commandLineArgs = require("command-line-args");
const pkg = require("../package.json");
const CryptoEnv = require("../src/CryptoEnv");

const optionDefinitions = [
  {
    name: "help",
    alias: "h",
    type: Boolean,
  },
  {
    name: "new-key",
    alias: "n",
    type: String,
  },
  {
    name: "list",
    alias: "l",
    type: Boolean,
  },
  {
    name: "enable",
    alias: "e",
    type: Boolean,
  },
  {
    name: "disable",
    alias: "d",
    type: Boolean,
  },
  {
    name: "toggle",
    alias: "t",
    type: Boolean,
  },
  {
    name: "env-path",
    alias: "p",
    type: String,
  },
  {
    name: "check-previous",
    alias: "c",
    type: Boolean,
  },
  {
    name: "no-optimization",
    alias: "u",
    type: Boolean,
  },
];

function error(message) {
  if (!Array.isArray(message)) {
    message = [message];
  }
  console.error(message[0]);
  if (message[1]) {
    console.info(message[1]);
  }
  /*eslint-disable-next-line*/
  process.exit(1);
}

let options = {};
try {
  options = commandLineArgs(optionDefinitions, {
    camelCase: true,
  });
} catch (e) {
  error(e.message, "Launch cryptoenv -h for help");
}

if (options.help || Object.keys(options).length === 0) {
  console.info(`
Welcome to CryptoEnv v${pkg.version}
Manage encrypted env variable in CLI applications like eating candies

For help look at
https://github.com/secrez/cryptoenv#readme

Options:
  -n, --new -key [key name]       Add a new key
  -l, --list                      List the keys' names
  -e, --enable                    Enables the keys
  -d, --disable                   Disables the keys
  -t, --toggle                    Toggle enabled/disabled keys
  -p, --env-path [env file path]  Specifies where the env file path
  -f, --force-previous-pwd        Forces to use the same password
                                    used previously (like until v0.1.8)
  -u, --no-optimization           Skips the .env optimization, that removes
                                    empty rows

Notes:
  --e has priority on --disable and --toggle
  --disable has priority on --toggle
  if --list is set, -e, -d or -t are ignored

Example;
  cryptoenv -n MAINNET_PK              Add the new key called MAINNET_PK
  cryptoenv -n MAINNET_PK -f           Add the new key called MAINNET_PK forcing to
                                         use the same password used previously
  cryptoenv -lp \`pwd\`/../.prod-env   Lists the keys in the .prod-env file
`);
  // eslint-disable-next-line no-process-exit
  process.exit(0);
}

options.isCLI = true;

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
