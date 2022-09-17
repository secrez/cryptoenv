# CryptoEnv

Manage encrypted env variable in CLI applications like eating candies

## Why CryptoEnv?

Many CLI tools use env variable to manage critical processes. Take for example [Hardhat](https://github.com/NomicFoundation/hardhat). To deploy a smart contract to Ethereum, most likely you have to put your private key in an `.env` file. That file is git-ignored, of course. Still, mistakes are behind the corner and the approach is very risky. For this reason, I created [Hardhood](github.com/secrez/hardhood), a wrapper around Hardhat, to solve this specific issue, but that solution has some problem, and it is maybe too specific. CryptoEnv uses part of the code written for Hardhood, to manage a more generic process.

## Usage

### In the shell

To set up your encrypted variables, you must install CryptoEnv globally

```
npm i -g cryptoenv
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

### In your node app

Install it as usual

```
npm i cryptoenv
```

Let's do the case of Hardhat.
You have a conf file called `hardhat.config.js`. At the beginning of that file you can read the env variables with, for example Dotenv, and after requiring CryptoEnv, like here:

```javascript
require("dotenv").config();
require("cryptoenv").parse();
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

If you just press enter when asked for the password, the decryption will be ignored. CryptoEnv will throw an error only if the password is wrong.

To avoid that Hardhat gives you an error when you skip the decryption, you can set up a variable OWNER_KEY in the `.env` file, with a testing key. When you use CryptoEnv, the variable will be overwritten.

Notice that after saving the first encrypted key, for all the others you must use the same password.

### My app shows the request for password more than one time

Some apps launch child processes. If they run more than one child process, the environment does not look decrypted and CryptoEnv makes a new request.

For example, when you run a script with Hardhat, it first runs a first process to compile the smart contracts, then runs a second process to execute the script. In that case, you can just press enter at the first request, and input the password only at the second.

### Multiple apps

Sometimes you have in a repo multiple apps and it is possible that you do not want to share data with them. You can filter your variables using RegExp like here:

```javascript
require("cryptoenv").parse(/^hardhat/);
```

and take only the variables that start with "hardhat".
You can also pass a function that returns a boolean, like:

```javascript
const words = ["home", "office", "street"];
require("cryptoenv").parse((e) => words.includes(e));
```

For example, if you want to skip the decryption when testing the contracts with Hardhat, you could require it as:

```javascript
require("cryptoenv").parse(() => {
  return NODE_ENV !== "test";
});
```

(notice that Hardhat does not set the NODE_ENV variable during tests)

## Enable/disable

It can be annoying be forced to skip the decryption all the time you launch a compilation or a test. To toggle the configuration, i.e., disable or enable the encrypted variable, you can run

```shell
cryptoEnv -t
```

## Skip the log when needed

In some cases, the console.log that tells about the encrypted keys can create problems because the output is used as is. For example, flattening a contract with Hardhat.

To avoid seeing the log, you can add the options `noLogsIfNoKeys` like

```javascript
require("cryptoenv").parse({
  noLogsIfNoKeys: true,
});
```

Alternatively, you can set the variable `NO_LOGS_IF_NO_KEYS` in the environment.~~~~

## About security

CryptoEnv uses the package @secrez/crypto from Secrez https://github.com/secrez/secrez

## Help

If you run cryptoenv without parameters, a help screen will be displayed:

```
Welcome to CryptoEnv v0.1.3
Manage encrypted env variable in CLI applications like eating candies

For help look at
https://github.com/secrez/cryptoenv#readme

Options:
  -n, --new  [key name]       Add a new key
  -l, --list                  List the keys' names
  -t, --toggle                Toggle enabled/disabled keys
```

## History

**0.1.7**

- Add `noLogsIfNoKeys` options in `.parse` to skip any logging test if no keys are found
- Add same skip if an ENV variable `NO_LOGS_IF_NO_KEYS` is set

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
