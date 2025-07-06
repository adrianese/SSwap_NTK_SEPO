const fs = require("fs");
const path = require("path");

const sourcePath = path.join(__dirname, "..", "artifacts", "contracts", "SimpleSwap.sol", "SimpleSwap.json");
const destPath = path.join(__dirname, "..", "frontend", "ABI", "SimpleSwap.json");

fs.copyFileSync(sourcePath, destPath);
console.log("✅ ABI copied to frontend/ABI/");

//node scripts/copyABI.js