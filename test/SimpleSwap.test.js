const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let simpleSwap, tokenA, tokenB, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const TestToken = await ethers.getContractFactory("TestToken");
    tokenA = await TestToken.deploy("MockTokenA", "MTA", 18);
    tokenB = await TestToken.deploy("MockTokenB", "MTB", 18);

    await tokenA.deployed();
    await tokenB.deployed();

    const SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy();
    await simpleSwap.deployed();

    await simpleSwap.initializeTokens(tokenA.address, tokenB.address);
  });

  it("should return a price greater than zero", async function () {
    const price = await simpleSwap.getPrice();
    expect(price).to.be.gt(0);
  });

  it("should add liquidity correctly", async function () {
    await tokenA.approve(simpleSwap.address, ethers.utils.parseEther("100"));
    await tokenB.approve(simpleSwap.address, ethers.utils.parseEther("200"));

    const liquidity = await simpleSwap.addLiquidity(
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("200")
    );

    expect(liquidity).to.exist;
  });

  it("should swap tokens", async function () {
    // Transfer tokens to user
    await tokenA.transfer(addr1.address, ethers.utils.parseEther("50"));
    await tokenA
      .connect(addr1)
      .approve(simpleSwap.address, ethers.utils.parseEther("50"));

    // Swap
    await simpleSwap
      .connect(addr1)
      .swapExactTokensForTokens(
        ethers.utils.parseEther("10"),
        0,
        tokenA.address
      );

    const balanceB = await tokenB.balanceOf(addr1.address);
    expect(balanceB).to.be.gt(0);
  });
});
