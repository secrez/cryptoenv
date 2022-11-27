const { assert, expect } = require("chai");
const path = require("path");
const fs = require("fs-extra");
let CryptoEnv = require("../src/CryptoEnv");
const { assertThrowsMessage } = require("./helpers");

describe("CryptoEnv", async function () {
  let tmpPath = path.resolve(__dirname, "../tmp/test");
  let envPath = path.join(tmpPath, ".env");
  let value = "8s8s8s8s87w7w7wydydydyd6d6d6d6";
  let password = "some-very-strong-password";
  let value2 = "9s9s9s9sueueueywywywywhdhd";
  let password2 = "some-other-password";

  before(async function () {});

  beforeEach(async function () {
    await fs.emptyDir(tmpPath);
    await fs.copy(path.resolve(__dirname, "fixtures/.env"), envPath);
    delete process.env.__decryptionAlreadyDone__;
  });

  after(async function () {
    // await fs.emptyDir(tmpPath);
  });

  describe("list", async function () {
    it("should return the env plus the existing encrypted variables", async function () {
      let cryptoEnv = new CryptoEnv({ envPath, skipConsole: true });

      const { variables } = cryptoEnv.list(true);
      expect(Object.keys(variables).length).equal(2);
      expect(variables.myKey).equal(
        "BqeLHsJps3fw484ekR2ynDSLmwt52LfFPV67nVWPo6zjDmQ3u4TMJ2oGqm35VYI+Ejr7UMnZHWuOUKIXVJqsr+3trn2vFg=="
      );
      expect(
        CryptoEnv.Crypto.decrypt(
          variables.myKey,
          CryptoEnv.Crypto.SHA3(password)
        )
      ).equal(value);
      expect(variables.myOtherKey).equal(
        "yWdotYMMgZioXDW95yOd0MMW1duInmuKbKqdElNBruAP4+dv5jYeLY4ADlzgeCSVPim2VPz3u6tC3aGGTm7LViLc"
      );
      expect(
        CryptoEnv.Crypto.decrypt(
          variables.myOtherKey,
          CryptoEnv.Crypto.SHA3(password2)
        )
      ).equal(value2);
    });
  });

  describe("encryptAndSave", async function () {
    it("should encrypt a new variable and save it in .env", async function () {
      let newKey = "privateKey";
      let value1 = "7fys8f7ywbfwbyef8sbfs8dfysd8cysdchsdcysc";
      let cryptoEnv = new CryptoEnv({ envPath, skipConsole: true, newKey });
      await cryptoEnv.encryptAndSave(value1, password);
      const { variables } = cryptoEnv.list(true);
      expect(Object.keys(variables).length).equal(3);
      expect(variables.myKey).equal(
        "BqeLHsJps3fw484ekR2ynDSLmwt52LfFPV67nVWPo6zjDmQ3u4TMJ2oGqm35VYI+Ejr7UMnZHWuOUKIXVJqsr+3trn2vFg=="
      );
      expect(!!variables[newKey]).equal(true);
    });

    it("should replace an existing variable and save it in .env", async function () {
      let newKey = "myKey";
      let value1 = "workdansdaBANK9987";
      let cryptoEnv = new CryptoEnv({ envPath, skipConsole: true, newKey });
      await cryptoEnv.encryptAndSave(value1, password);
      const { variables } = cryptoEnv.list(true);
      expect(Object.keys(variables).length).equal(2);
      expect(variables.myKey).not.equal(
        "BqeLHsJps3fw484ekR2ynDSLmwt52LfFPV67nVWPo6zjDmQ3u4TMJ2oGqm35VYI+Ejr7UMnZHWuOUKIXVJqsr+3trn2vFg=="
      );
      expect(!!variables[newKey]).equal(true);
    });

    it("should throw if using another password if forcePreviousPwd=true", async function () {
      let newKey = "privateKey";
      let value1 = "7fys8f7ywbfwbyef8sbfs8dfysd8cysdchsdcysc";
      let cryptoEnv = new CryptoEnv({
        envPath,
        skipConsole: true,
        newKey,
        forcePreviousPwd: true,
      });
      await assertThrowsMessage(
        cryptoEnv.encryptAndSave(value1, "a-new-strong-password"),
        "This is not the password used in the past"
      );
    });

    it("should not throw if using same password and forcePreviousPwd=true", async function () {
      await fs.copy(path.resolve(__dirname, "fixtures/.env2"), envPath + 2);
      let newKey = "privateKey";
      let value1 = "7fys8f7ywbfwbyef8sbfs8dfysd8cysdchsdcysc";
      let cryptoEnv = new CryptoEnv({
        envPath: envPath + 2,
        skipConsole: true,
        newKey,
        forcePreviousPwd: true,
      });
      try {
        cryptoEnv.encryptAndSave(value1, password);
        assert("It did not throw");
      } catch (e) {
        expect(e.message).equal("Whoops");
      }
    });
  });

  describe("parse", async function () {
    it("should parse the .env file and decrypt the variables", async function () {
      delete process.env.myKey;
      require("dotenv").config({ path: envPath });
      let cryptoEnv = new CryptoEnv({ skipConsole: true });
      cryptoEnv.parse(undefined, password);
      expect(process.env.myKey).equal(value);
    });

    it("should parse with a filter (regex)", async function () {
      delete process.env.myKey;
      delete process.env.myOtherKey;
      require("dotenv").config({ path: envPath });
      let cryptoEnv = new CryptoEnv({ skipConsole: true });
      cryptoEnv.parse(/argoPlan/, password);
      expect(process.env.myKey).equal(undefined);
      delete process.env.__decryptionAlreadyDone__;
      cryptoEnv.parse(/key/i, password);
      expect(process.env.myKey).equal(value);
      expect(process.env.myOtherKey).equal(undefined);
    });

    it("should parse with a filter (regex) and some option", async function () {
      delete process.env.myOtherKey;
      require("dotenv").config({ path: envPath });
      let cryptoEnv = new CryptoEnv({ skipConsole: true });
      cryptoEnv.parse({ alwaysLog: true }, /Other/, password2);
      expect(cryptoEnv.options.alwaysLog).equal(true);
      expect(process.env.myOtherKey).equal(value2);
    });

    it("should parse with a filter (function)", async function () {
      delete process.env.myKey;
      process.env.nodeENV = "test";
      require("dotenv").config({ path: envPath });
      let cryptoEnv = new CryptoEnv({ skipConsole: true });
      cryptoEnv.parse(() => process.env.nodeENV !== "test", password);
      expect(process.env.myKey).equal(undefined);
      delete process.env.__decryptionAlreadyDone__;
      cryptoEnv.parse(() => process.env.nodeENV === "test", password);
      expect(process.env.myKey).equal(value);
    });

    it.skip("should parse the .env file and decrypt the variables", async function () {
      delete process.env.myKey;
      this.timeout(60000);
      // to verify it manually
      require("dotenv").config({ path: envPath });
      let cryptoEnv = new CryptoEnv({ skipConsole: true });
      cryptoEnv.parse();
      expect(process.env.myKey, value);
    });
  });

  describe("toggle", async function () {
    it("should toggle the variables", async function () {
      let cryptoEnv = new CryptoEnv({
        envPath,
        skipConsole: true,
      });
      await cryptoEnv.toggle();
      expect(Object.keys(cryptoEnv.list(true).variables).length).equal(0);
      await cryptoEnv.toggle();
      expect(Object.keys(cryptoEnv.list(true).variables).length).equal(2);
    });
  });

  describe("disable", async function () {
    it("should disable the variables", async function () {
      let cryptoEnv = new CryptoEnv({
        envPath,
        skipConsole: true,
        disable: true,
      });
      await cryptoEnv.toggle();
      expect(Object.keys(cryptoEnv.list(true).variables).length).equal(0);
    });
  });

  describe("enable", async function () {
    it("should enable the variables", async function () {
      let cryptoEnv = new CryptoEnv({
        envPath,
        skipConsole: true,
        disable: true,
      });
      await cryptoEnv.toggle();
      expect(Object.keys(cryptoEnv.list(true).variables).length).equal(0);
      cryptoEnv = new CryptoEnv({
        envPath,
        skipConsole: true,
        enable: true,
      });
      await cryptoEnv.toggle();
      expect(Object.keys(cryptoEnv.list(true).variables).length).equal(2);
    });
  });
});
