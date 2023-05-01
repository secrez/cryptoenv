# CryptoEnv

Manage encrypted env variable in CLI applications like eating candies

## Why CryptoEnv?

Many CLI tools use env variable to manage critical processes.

Take for example [Hardhat](https://github.com/NomicFoundation/hardhat) — a framework to develop, test and deploy smart contracts to an EVM-compatible blockchain.

To deploy a smart contract, most likely you have to put your private key in an `.env` file. That file is git-ignored, of course. Still, mistakes are behind the corner and the approach is very risky.

The solution is to encrypt the variables in the `.env` file.

## Usage

### In the shell

If you run the cryptoenv CLI without parameters, a help screen like the one below will be displayed:

```
Welcome to CryptoEnv v0.2.0
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
```

To set up your encrypted variables, you must install CryptoEnv globally

```
npm i -g @secrez/cryptoenv
```

Then, to create a new encrypted env variable for `OWNER_KEY` move in the folder where your app is, and run

```
cryptoenv -n OWNER_KEY
```

CryptoEnv will ask

1. the data to be encrypted (in this case a private key)
2. the password to encrypt it

Finally, it will save the encrypted private key in `.env`, creating the file if it does not exist.

In the case above, in your `.env` file you will have something like

```
cryptoEnv_OWNER_KEY=vnJSFJ5E4ZHT1hd8tmMduc1HbQqmkXE/dReUmjHFvud5DsquU6VrOZ+1K3wFj2wYIc8KaClbZWlAtG5HuE2QfE1hx3snHBpz0sqkhfM2v8gTTR77RnLZ23GcKYTGa2G5frcuECngSpE=
```

Starting from v0.2.0, you can use different passwords to encrypt the different variables.
This allows a team to share an encrypted env, knowing that team members can access only their own keys.

#### Enable/disable

It can be annoying be forced to skip the decryption all the time you launch a compilation or a test. To toggle the configuration, i.e., disable or enable the encrypted variables, you can run

```shell
cryptoEnv -t
```

but it is better to use `--enable` and `--disable` to explicit call for a specific action.

### In your node app

Install it as usual

```
npm i @secrez/cryptoenv
```

Let's do the case of Hardhat.

You have a conf file called `hardhat.config.js`. At the beginning of that file you can read the env variables with, for example Dotenv, and after requiring CryptoEnv, like here:

```javascript
require("dotenv").config();
require("@secrez/cryptoenv").parse();
```

later in the file, when you configure Hardhat to use your private keys, you can have something like

```
    ...
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [
        process.env.OWNER_KEY
      ],
      chainId: 3
    },
    ...
```

If you just press enter when asked for the password, the decryption will be ignored.

Since v0.2.0, CryptoEnv does not throw an error if the password is wrong, it will just ignore it. This is necessary to manage variable encrypted with different passwords. Until v0.1.8, it was throwing because all the variables in a single `.env` had to been encrypted using the same password.

As a tip to avoid that Hardhat gives you an error when you skip the decryption, you can set up a variable OWNER_KEY in the `.env` file, with a testing key. When you use CryptoEnv, the variable will be overwritten with the decrypted value.

### My app shows the request for password more than one time

Some apps launch more than a single child processes. In this case, the environment can be reinstated and it does not look decrypted, so that CryptoEnv makes a new request.

For example, when you run a script with Hardhat, it first runs a first process to compile the smart contracts, then runs a second process to execute the script. In that case, you can just press enter at the first request, and input the password only at the second.

### Multiple apps

Sometimes you have in a repo multiple apps, and it is possible that you do not want to share data with them. You can filter your variables using RegExp like here:

```javascript
require("@secrez/cryptoenv").parse(/^hardhat/);
```

and take only the variables that start with "hardhat".
You can also pass a function that returns a boolean, like:

```javascript
const words = ["home", "office", "street"];
require("@secrez/cryptoenv").parse((e) => words.includes(e));
```

For example, if you want to skip the decryption when testing the contracts with Hardhat, you could require it as:

```javascript
require("@secrez/cryptoenv").parse(() => {
  return NODE_ENV !== "test";
});
```

Notice that Hardhat does not set the NODE_ENV variable during tests, you must set it yourself.

You can also mix the settings, like

```javascript
const cryptoEnv = require("@secrez/cryptoenv");
const words = ["home", "office", "street"];
cryptoEnv.parse({ alwaysLog: true }, (e) => words.includes(e));
```

You can also decide to use different prefix for the encrypted variable. By default, the prefix is `cryptoEnv_`, but you can change it with the option `prefix`.

Finally, if your variables are in a file different than `.env` in the root of the repo, you can specify the full path with the option `--env-path` launching the CLI.

When using hardhat, you can also specify when running cryptoenv, puttin in your `hardhat.config.js` file a code like this:

```javascript
const taskName = process.argv[2];
if (/(deploy|console)/.test(taskName)) {
  require("cryptoenv").parse();
}
```

This way you ask cryptoenv to decrypt the variables only when you run the deploy or the console task.

## Show the log even when not needed

The console.log that tells about the encrypted keys can create problems because the output is used as is. For this reason, starting from version 0.2.0, by default, cryptoenv returns a feedback only if it finds active encrypted variables in `.env`.

If you want that the log is showed anytime, use the options `alwaysLog`, like

```javascript
require("@secrez/cryptoenv").parse({
  alwaysLog: true,
});
```

Alternatively, you can set the variable `ALWAYS_LOG` in the environment.

**No logs at all?**

If you like to suppress any log, you can use the option `noLogs` or the env variable `NO_LOGS`.

## About security

CryptoEnv uses the package @secrez/crypto from Secrez https://github.com/secrez/secrez

## History

**0.2.2**

- skipping post-install when installed in production

**0.2.1**

- moved from cryptoenv to @secrez/cryptoenv to make more clear the connection with Secrez
- at the same time cryptoenv has been deprecated

**0.2.0 - Breaking changes**

- Reverse the behavior. If not specified, it returns feedback only if there are encrypted variables in the env
- Add `alwaysLog` option and `ALWAYS_LOG` env variable to show the log all the time, disabling the previous option `noLogsIfNoKeys`, which was forcing the opposite behavior
- The CLI `--toggle` option returns an explanation feedback
- The CLI `--list` option returns also the not-active variables
- Calling `cryptoenv` without options shows the help
- Supports different passwords for different variables. When decrypting, it decrypts only the keys that were encrypted with the specified password
- Creating a new key it optimizes the .env file removing empty rows except if:
- The CLI `--no-optimization` skips the `.env` optimization

**0.1.8**

- Add `noLogs` option and `NO_LOGS` env variable to suppress any logging
- Add `noLogsIfNoKeys` option and `NO_LOGS_IF_NO_KEYS` env variable to skip any logging test if no keys are found

**0.1.6**

- Improve message when keys exist but are disabled

**0.1.4**

- Toggle disable/enable encrypted keys using option `-t, --toggle`

**0.1.3**

- Setting an env variable to avoid making a new request if the parsing is triggered again in the same process

**0.1.0**

- First version

## Copyright

(c) 2022 Francesco Sullo <francesco@sullo.co>

## License

MIT — enjoy it :-)
