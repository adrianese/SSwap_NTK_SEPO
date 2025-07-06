const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleSwap", function () {
  let SimpleSwap, simpleSwap, owner, addr1, addr2, tokenA, tokenB;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy Token A
    const TokenA = await ethers.getContractFactory("MyToken");
    tokenA = await TokenA.deploy(
      "Token Alpha",
      "TKA",
      ethers.parseEther("1000000")
    );
    await tokenA.waitForDeployment();

    // Deploy Token B
    const TokenB = await ethers.getContractFactory("MyToken");
    tokenB = await TokenB.deploy(
      "Token Beta",
      "TKB",
      ethers.parseEther("1000000")
    );
    await tokenB.waitForDeployment();

    // Deploy SimpleSwap
    SimpleSwap = await ethers.getContractFactory("SimpleSwap");
    simpleSwap = await SimpleSwap.deploy(
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
    await simpleSwap.waitForDeployment();

    // Transfer some initial tokens to the SimpleSwap contract for liquidity
    await tokenA.transfer(
      await simpleSwap.getAddress(),
      ethers.parseEther("1000")
    );
    await tokenB.transfer(
      await simpleSwap.getAddress(),
      ethers.parseEther("1000")
    );

    // Give addr1 some tokens to swap
    await tokenA.transfer(addr1.address, ethers.parseEther("100"));
    await tokenB.transfer(addr1.address, ethers.parseEther("100"));
  });

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await simpleSwap.tokenA()).to.equal(await tokenA.getAddress());
      expect(await simpleSwap.tokenB()).to.equal(await tokenB.getAddress());
    });

    it("Should have initial token balances", async function () {
      expect(await simpleSwap.getTokenABalance()).to.equal(
        ethers.parseEther("1000")
      );
      expect(await simpleSwap.getTokenBBalance()).to.equal(
        ethers.parseEther("1000")
      );
    });
  });

  describe("Swapping", function () {
    it("Should allow swapping TokenA for TokenB", async function () {
      const amountToSwap = ethers.parseEther("10"); // 10 TokenA
      const expectedAmountB = ethers.parseEther("10"); // Expect 10 TokenB (1:1 ratio in this example)

      // Approve SimpleSwap to spend TokenA from addr1
      await tokenA
        .connect(addr1)
        .approve(await simpleSwap.getAddress(), amountToSwap);

      // Perform the swap
      await expect(simpleSwap.connect(addr1).swapAToB(amountToSwap))
        .to.emit(tokenB, "Transfer") // Check for TokenB transfer out
        .withArgs(
          await simpleSwap.getAddress(),
          addr1.address,
          expectedAmountB
        );

      // Verify balances after swap
      expect(await tokenA.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("90")
      ); // 100 - 10
      expect(await tokenB.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("110")
      ); // 100 + 10
      expect(await simpleSwap.getTokenABalance()).to.equal(
        ethers.parseEther("1010")
      ); // 1000 + 10
      expect(await simpleSwap.getTokenBBalance()).to.equal(
        ethers.parseEther("990")
      ); // 1000 - 10
    });

    it("Should allow swapping TokenB for TokenA", async function () {
      const amountToSwap = ethers.parseEther("5"); // 5 TokenB
      const expectedAmountA = ethers.parseEther("5"); // Expect 5 TokenA (1:1 ratio in this example)

      // Approve SimpleSwap to spend TokenB from addr1
      await tokenB
        .connect(addr1)
        .approve(await simpleSwap.getAddress(), amountToSwap);

      // Perform the swap
      await expect(simpleSwap.connect(addr1).swapBToA(amountToSwap))
        .to.emit(tokenA, "Transfer") // Check for TokenA transfer out
        .withArgs(
          await simpleSwap.getAddress(),
          addr1.address,
          expectedAmountA
        );

      // Verify balances after swap
      expect(await tokenB.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("95")
      ); // 100 - 5
      expect(await tokenA.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("105")
      ); // 100 + 5
      expect(await simpleSwap.getTokenBBalance()).to.equal(
        ethers.parseEther("1005")
      ); // 1000 + 5
      expect(await simpleSwap.getTokenABalance()).to.equal(
        ethers.parseEther("995")
      ); // 1000 - 5
    });
  });

  describe("Price Calculation", function () {
    it("Should return correct price for A to B", async function () {
      const amountA = ethers.parseEther("100");
      const expectedAmountB = ethers.parseEther("100");
      expect(await simpleSwap.getPriceAtoB(amountA)).to.equal(expectedAmountB);
    });

    it("Should return correct price for B to A", async function () {
      const amountB = ethers.parseEther("50");
      const expectedAmountA = ethers.parseEther("50");
      expect(await simpleSwap.getPriceBToA(amountB)).to.equal(expectedAmountA);
    });
  });
});
