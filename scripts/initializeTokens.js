const hre = require("hardhat");

async function main() {
  const contractAddress = "0xDeployedContractAddress"; // reemplaza con la dirección real
  const tokenAAddress = "0x..."; // según el wallet conectado
  const tokenBAddress = "0x..."; // según el wallet conectado

  const simpleSwap = await hre.ethers.getContractAt(
    "SimpleSwap",
    contractAddress
  );
  const tx = await simpleSwap.initializeTokens(tokenAAddress, tokenBAddress);
  await tx.wait();

  console.log("Tokens inicializados correctamente");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
