const { assert, expect } = require("chai");

const Helpers = {
  async assertThrowsMessage(promise, message) {
    const notThrew = "It did not throw";
    try {
      await promise;
      throw new Error(notThrew);
    } catch (e) {
      const isTrue = e.message.indexOf(message) > -1;
      if (!isTrue) {
        console.error("Expected:", message);
        console.error("Received:", e.message);
        if (e.message !== notThrew) {
          console.error();
          console.error(e);
        }
      }
      assert.isTrue(isTrue);
    }
  },
};

module.exports = Helpers;
