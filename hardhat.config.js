

require("@nomicfoundation/hardhat-toolbox");
const { vars } = require("hardhat/config");
//procesamos .env
require("dotenv").config();

const INFURA_NODE = process.env.INFURA_NODE;
const MY_PRIV_KEY = process.env.MY_PRIV_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: INFURA_NODE,
      accounts: [MY_PRIV_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};
