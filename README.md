# CryptoEnv

A simple way to manage encrypted env variables

## Why CryptoEnv?

Many tools uses env variable to manage critical processes. Take for example [Hardhat](https://github.com/NomicFoundation/hardhat). To deploy a smart contract to Ethereum, most likely you have to put your private key in an `.env` file. That file is git-ignored, of course. Still, mistakes are behind the corner and the approach is very risky. We created [Hardhood](github.com/secrez/hardhood), a wrapper around Hardhat, to solve this specific issue, but that solution has some problem, and it is maybe too specific. CryptoEnv uses part of the code written for Hardhood, to manage a more generic process.

## Usage

### In the shell

To set up your encrypted variables, you must install CryptoEnv globally

```
npm i -g envcrypto
```

Then, to create a new encrypted env variable for `OWNER_KEY` move in the folder where you app is, and run

```
cryptoenv -n OWNER_KEY
```

CryptoEnv will ask

1. the data to be encrypted (in this case a private key)
2. the password to encrypt it

Finally, it will save the encrypted private key in `~/.env`, creating the file if it does not exist.

In the case above, in you `.env` file you will have something like

```
cryptoEnv_OWNER_KEY=vnJSFJ5E4ZHT1hd8tmMduc1HbQqmkXE/dReUmjHFvud5DsquU6VrOZ+1K3wFj2wYIc8KaClbZWlAtG5HuE2QfE1hx3snHBpz0sqkhfM2v8gTTR77RnLZ23GcKYTGa2G5frcuECngSpE=
```

### In your node app

Install it as usual

```
npm i cryptoenv
```

Let's do the case of Hardhat. You have a conf file called `hardhat.config.js`. At the beginning of that file you can read the env variable with, for example Dotenv, and after requiring CryptoEnv, like here:

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

To avoid that Hardhat gives you an error when you skip the decryption, you can set up a variable OWNER_KEY in the `.env` file, with a testing key. When you will use CryptoEnv, the variable will be overwritten.

Notice that after saving the first encrypted key, for all the others you must use the same password.

### Multiple apps

Sometimes you have in a repo multiple apps and it is possible that you do not want to share data with them. You can filter your variables using RegExp like here:

```javascript
require("cryptoenv").parse(/^hardhat/);
```

and take only the variables that start with "hardhat". In a more general way, you can also pass a function that returns a boolean. For example, if you want to skip the decryption when testing the contracts with Hardhat, you could require it as:

```javascript
require("cryptoenv").parse(() => {
  return NODE_ENV !== "test";
});
```

## About security

CryptoEnv uses the package @secrez/crypto from Secrez https://github.com/secrez/secrez

## Help

If you run cryptoenv without parameters, a help screen will be displayed:

```
Welcome to CryptoEnv v0.1.0
Manage encrypted env variable like eating a candy

For help look at
https://github.com/secrez/cryptoenv#readme

Options:
  -n, --new  [key]            Add a new key for current project
  -l, --list                  List the keys' names for the current project

```

## History

**0.0.1**

- First version

## Copyright

(c) 2022 Francesco Sullo <francesco@sullo.co>

## License

```MIT — enjoy it :-)


```
