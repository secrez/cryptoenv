const { assert, expect } = require("chai");
const path = require("path");
const fs = require("fs-extra");
let CryptoEnv = require("../src/CryptoEnv");
const { assertThrowsMessage } = require("./helpers");

describe("CryptoEnv", async function () {
  let tmpPath = path.resolve(__dirname, "../tmp/test");
  let envPath = path.join(tmpPath, ".env");
  let password = "some-very-strong-password";

  before(async function () {});

  beforeEach(async function () {
    await fs.emptyDir(tmpPath);
    await fs.copy(path.resolve(__dirname, "fixtures/.env"), envPath);
  });

  after(async function () {
    // await fs.emptyDir(tmpPath);
  });

  describe("list", async function () {
    it("should return the env plus the existing encrypted variables", async function () {
      let cryptoEnv = new CryptoEnv({ envPath });

      const { variables } = cryptoEnv.list(true);
      expect(Object.keys(variables).length).equal(1);
      expect(variables.myKey).equal(
        "BqeLHsJps3fw484ekR2ynDSLmwt52LfFPV67nVWPo6zjDmQ3u4TMJ2oGqm35VYI+Ejr7UMnZHWuOUKIXVJqsr+3trn2vFg=="
      );
      let value = "8s8s8s8s87w7w7wydydydyd6d6d6d6";
      expect(
        CryptoEnv.Crypto.decrypt(
          variables.myKey,
          CryptoEnv.Crypto.SHA3(password)
        )
      ).equal(value);
    });
  });

  describe("encryptAndSave", async function () {
    it("should encrypt a new variable and save it in .env", async function () {
      let newKey = "privateKey";
      let value = "7fys8f7ywbfwbyef8sbfs8dfysd8cysdchsdcysc";
      let cryptoEnv = new CryptoEnv({ envPath, newKey });
      await cryptoEnv.encryptAndSave(value, password);
      const { variables } = cryptoEnv.list(true);
      expect(Object.keys(variables).length).equal(2);
      expect(variables.myKey).equal(
        "BqeLHsJps3fw484ekR2ynDSLmwt52LfFPV67nVWPo6zjDmQ3u4TMJ2oGqm35VYI+Ejr7UMnZHWuOUKIXVJqsr+3trn2vFg=="
      );
      expect(!!variables[newKey]).equal(true);
    });

    it("should replace an existing variable and save it in .env", async function () {
      let newKey = "myKey";
      let value = "workdansdaBANK9987";
      let cryptoEnv = new CryptoEnv({ envPath, newKey });
      await cryptoEnv.encryptAndSave(value, password);
      const { variables } = cryptoEnv.list(true);
      expect(Object.keys(variables).length).equal(1);
      expect(variables.myKey).not.equal(
        "BqeLHsJps3fw484ekR2ynDSLmwt52LfFPV67nVWPo6zjDmQ3u4TMJ2oGqm35VYI+Ejr7UMnZHWuOUKIXVJqsr+3trn2vFg=="
      );
      expect(!!variables[newKey]).equal(true);
    });

    it("should throw if using another password", async function () {
      let newKey = "privateKey";
      let value = "7fys8f7ywbfwbyef8sbfs8dfysd8cysdchsdcysc";
      let cryptoEnv = new CryptoEnv({ envPath, newKey });
      assertThrowsMessage(
        cryptoEnv.encryptAndSave(value, "a-new-strong-password"),
        "This is not the password used in the past"
      );
    });
  });

  describe("parse", async function () {
    it("should parse the .env file and decrypt the variables", async function () {
      delete process.env.myKey;
      require("dotenv").config({ path: envPath });
      let cryptoEnv = new CryptoEnv();
      cryptoEnv.parse(undefined, password);
      expect(process.env.myKey).equal("8s8s8s8s87w7w7wydydydyd6d6d6d6");
    });

    it("should parse with a filter", async function () {
      delete process.env.myKey;
      require("dotenv").config({ path: envPath });
      let cryptoEnv = new CryptoEnv();
      cryptoEnv.parse(/argoPlan/, password);
      expect(process.env.myKey).equal(undefined);
    });

    it("should parse with a filter", async function () {
      delete process.env.myKey;
      process.env.nodeENV = "test";
      require("dotenv").config({ path: envPath });
      let cryptoEnv = new CryptoEnv();
      cryptoEnv.parse(() => process.env.nodeENV !== "test" , password);
      expect(process.env.myKey).equal(undefined);
    });


    it.skip("should parse the .env file and decrypt the variables", async function () {
      delete process.env.myKey;
      this.timeout(60000);
      // to verify it manually
      require("dotenv").config({ path: envPath });
      let cryptoEnv = new CryptoEnv();
      cryptoEnv.parse();
      expect(process.env.myKey, "8s8s8s8s87w7w7wydydydyd6d6d6d6");
    });
  });
});
