const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const SimpleSwapModule = buildModule("SimpleSwapModule", (m) => {
  const simpleSwap = m.contract("SimpleSwap", []);
  return { simpleSwap };
});

module.exports = SimpleSwapModule;


//npx hardhat ignition deploy ignition/modules/SimpleSwap.js

