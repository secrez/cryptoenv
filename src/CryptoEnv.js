const path = require("path");
const fs = require("fs-extra");
const inquirer = require("inquirer");
const Crypto = require("@secrez/crypto");
const chalk = require("chalk");

class CryptoEnv {
  constructor(options = {}) {
    this.options = options;
    this.prefix = this.options.prefix || "cryptoEnv_";
    /* istanbul ignore if */
    if (this.options.cli) {
      const currentDir = process.cwd();
      this.envPath = options.envPath || path.join(currentDir, ".env");
    } else {
      this.envPath = options.envPath;
    }
  }

  /* istanbul ignore next */
  consoleInfo(force, ...params) {
    if (!(this.options.noLogs || process.env.NO_LOGS)) {
      if (force || this.options.alwaysLog || process.env.ALWAYS_LOG) {
        console.info(...params);
      }
    }
  }

  /* istanbul ignore next */
  async run() {
    const { newKey, list, toggle, enable, disable } = this.options;
    if (newKey) {
      return this.newKey();
    } else if (toggle || enable || disable) {
      return this.toggle();
    } else if (list) {
      return this.list();
    } else {
      console.error("Unknown option.");
    }
  }

  isBase64(encVariable = "") {
    return (
      encVariable.length > 6 &&
      /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/.test(
        encVariable
      )
    );
  }

  async toggle() {
    const { enable, disable } = this.options;
    if (await fs.pathExists(this.envPath)) {
      let env = (await fs.readFile(this.envPath, "utf8")).split("\n");
      let newEnv = [];
      for (let row of env) {
        if (
          RegExp(
            `^${enable ? "#" : disable ? "" : "#{0,1}"}${this.prefix}([^=]+)=`
          ).test(row)
        ) {
          let encName = row.slice(0, row.indexOf("="));
          let encVariable = row.slice(row.indexOf("=") + 1);
          if (this.isBase64(encVariable)) {
            if (/^#/.test(row)) {
              row = row.substring(1);
              this.consoleInfo(
                true,
                chalk.green("Enabling"),
                encName.substring(1)
              );
            } else {
              this.consoleInfo(true, chalk.red("Disabling"), encName);
              row = "#" + row;
            }
          }
        }
        newEnv.push(row);
      }
      await fs.writeFile(this.envPath, newEnv.join("\n") + "\n");
    }
  }

  hasDisabled() {
    const tentativeEnvPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(tentativeEnvPath)) {
      let env = fs.readFileSync(tentativeEnvPath, "utf8").split("\n");
      for (let key of env) {
        if (RegExp(`^#${this.prefix}([^=]+)=`).test(key)) {
          return true;
        }
      }
    }
  }

  list(asIs) {
    if (fs.existsSync(this.envPath)) {
      let env = fs.readFileSync(this.envPath, "utf8").split("\n");
      let variables = {};
      let active = true;
      for (let row of env) {
        if (RegExp(`^#{0,1}${this.prefix}([^=]+)=`).test(row)) {
          if (/^#/.test(row)) {
            active = false;
            if (this.options.listOnlyActive) {
              continue;
            }
          }
          let key = row.replace(/^#/, "").split(this.prefix)[1].split("=")[0];
          let encVariable = row.slice(row.indexOf("=") + 1);
          if (this.isBase64(encVariable)) {
            variables[key] = encVariable;
          }
        }
      }
      if (asIs) {
        return { variables, env };
      } else {
        this.consoleInfo(
          true,
          active ? "Active" : "Disabled",
          "env variables:"
        );
        this.consoleInfo(true, Object.keys(variables).join("\n"));
      }
    } else {
      if (asIs) {
        return { variables: {}, env: [] };
      }
      this.consoleInfo(true, "No encrypted env variables, yet");
    }
  }

  /* istanbul ignore next */
  async newKey() {
    let { variable } = await inquirer.prompt([
      {
        type: "password",
        name: "variable",
        message: "Type or paste your secret variable",
      },
    ]);
    if (!variable) {
      throw new Error("No secret has been passed");
    }
    variable = variable.replace(/^0x/, "");
    let password;
    await inquirer.prompt([
      {
        type: "password",
        name: "password1",
        mask: "*",
        message: "Type a good password",
        validate(value) {
          if (value.length > 6) {
            password = value;
            return true;
          } else {
            return "Come on, password too short :-(";
          }
        },
      },
      {
        type: "password",
        name: "password2",
        mask: "*",
        message: "Re-type the password",
        validate(value) {
          if (value === password) {
            return true;
          } else {
            return "The two password do not match. Try again or press Ctrl-c to cancel";
          }
        },
      },
    ]);
    await this.encryptAndSave(variable, password);
    this.consoleInfo(true, "Keys successfully stored");
  }

  async encryptAndSave(variable, password) {
    const pwd = Crypto.SHA3(password);
    if (this.options.forcePreviousPwd) {
      const { variables } = this.list(true);
      for (let key in variables) {
        try {
          Crypto.decrypt(variables[key], pwd);
        } catch (e) {
          throw new Error("This is not the password used in the past");
        }
      }
    }
    let encVariable = Crypto.encrypt(variable, pwd);
    await this.save(this.options.newKey, encVariable);
  }

  parse(
    options,
    filter,
    // for testing only. Do not pass a password, please.
    password
  ) {
    if (options instanceof RegExp || typeof options !== "object") {
      password = filter;
      filter = options;
    } else {
      this.options = Object.assign(this.options, options);
    }
    if (process.env.__decryptionAlreadyDone__) {
      return;
    }
    this.keys = {};
    for (let key in process.env) {
      if (
        RegExp(`^${this.prefix}`).test(key) &&
        this.isBase64(process.env[key])
      ) {
        let value = process.env[key];
        key = key.split(this.prefix)[1];
        if (
          !filter ||
          (typeof filter === "function" && filter(key)) ||
          (Object.prototype.toString.call(filter) &&
            filter.test &&
            filter.test(key))
        ) {
          this.keys[key] = value;
        }
      }
    }
    if (Object.keys(this.keys).length === 0) {
      if (this.hasDisabled()) {
        this.consoleInfo(
          false,
          chalk.grey(
            `CryptoEnv > some encrypted keys are disabled. Run "cryptoEnv -t" to enable them`
          )
        );
      } else {
        this.consoleInfo(
          false,
          chalk.grey(`CryptoEnv > no encrypted keys found`)
        );
      }
      process.env.__decryptionAlreadyDone__ = "TRUE";
      return;
    }
    /* istanbul ignore if */
    if (!password) {
      const prompt = require("prompt-sync")({});
      this.consoleInfo(
        true,
        chalk.green(
          "CryptoEnv > Type your password to decrypt the env, or press enter to skip it"
        )
      );
      password = prompt.hide();
      if (!password) {
        this.consoleInfo(true, chalk.grey("CryptoEnv > decryption skipped"));
        process.env.__decryptionAlreadyDone__ = "TRUE";
        return;
      }
    }
    this.decryptAll(filter, password);
  }

  decryptAll(filter, password) {
    let found = 0;
    for (let key in this.keys) {
      try {
        process.env[key] = Crypto.decrypt(
          this.keys[key],
          Crypto.SHA3(password)
        );
        found++;
      } catch (e) {
        // this.consoleInfo(true, chalk.red("Wrong password"));
        // process.exit(1);
      }
    }
    if (found) {
      this.consoleInfo(
        true,
        chalk.green(`CryptoEnv > ${found} key${found > 1 ? "s" : ""} decrypted`)
      );
    } else if (this.hasDisabled()) {
      this.consoleInfo(
        chalk.grey(
          false,
          `CryptoEnv > some encrypted keys are disabled. Run "cryptoEnv -t" to enable them`
        )
      );
    } else {
      this.consoleInfo(
        false,
        chalk.grey(`CryptoEnv > no encrypted keys found`)
      );
    }
    process.env.__decryptionAlreadyDone__ = "TRUE";
  }

  async save(key, value) {
    const { variables, env } = this.list(true);
    if (variables[key]) {
      for (let i = 0; i < env.length; i++) {
        if (RegExp(`${this.prefix}${key}=`).test(env[i])) {
          env[i] = `${this.prefix}${key}=${value}`;
          break;
        }
      }
    } else {
      env.push(`${this.prefix}${key}=` + value);
    }
    let str = "";
    for (let e of env) {
      if (!this.options.noOptimization && /^[\s\t]*$/.test(e)) {
        continue;
      }
      str += e + "\n";
    }
    await fs.writeFile(this.envPath, str);
  }
}

CryptoEnv.Crypto = Crypto;

module.exports = CryptoEnv;
