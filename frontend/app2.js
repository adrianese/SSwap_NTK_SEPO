let provider, signer, account, simpleSwapContract;
let isConnected = false;
let SimpleSwapArtifact;
const SIMPLE_SWAP_ADDRESS = "0x4Dc88C1a894312a199DCda91bEa418034E3CED9C"; // Replace with Sepolia address

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function mint(address to, uint256 amount)", // optional: depends if your mock tokens have it
  "function approve(address spender, uint256 amount)",
];

// UI Elements
const connectBtn = document.getElementById("connect-wallet-btn");
const walletStatusDiv = document.getElementById("wallet-status");
const accountSpan = document.getElementById("account-address");
const appContent = document.getElementById("app-content");
const tokenABalanceSpan = document.getElementById("token-a-balance");
const tokenBBalanceSpan = document.getElementById("token-b-balance");
const userBalanceA = document.getElementById("user-balance-A");
const userBalanceB = document.getElementById("user-balance-B");
const tokenASymbolSpan = document.getElementById("tokenA-symbol");
const tokenBSymbolSpan = document.getElementById("tokenB-symbol");

const swapInputAmount = document.getElementById("swap-input-amount");
const swapFromTokenSelect = document.getElementById("swap-from-token");
const swapStatusP = document.getElementById("swap-status");
const expectedOutputSpan = document.getElementById("expected-output");
const swapButton = document.getElementById("swap-button");

const priceInputAmount = document.getElementById("price-input-amount");
const priceFromTokenSelect = document.getElementById("price-from-token");
const getPriceButton = document.getElementById("get-price-button");
const currentPriceSpan = document.getElementById("current-price");

const mintBtn = document.getElementById("mint-mock-btn");
const refreshBalancesBtn = document.getElementById("refresh-balances-btn");

async function loadABI() {
  const res = await fetch("./ABI/SimpleSwap.json");
  SimpleSwapArtifact = await res.json();
}

async function toggleWallet() {
  if (!isConnected) {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
      account = await signer.getAddress();

      accountSpan.textContent = account;
      isConnected = true;
      connectBtn.textContent = "Disconnect Wallet";
      appContent.style.display = "block";

      simpleSwapContract = new ethers.Contract(
        SIMPLE_SWAP_ADDRESS,
        SimpleSwapArtifact.abi,
        signer
      );

      updateBalances();
      await confuseBootstrap();
    } catch (err) {
      console.error("Connect error:", err);
      alert("MetaMask error or user rejected request.");
    }
  } else {
    isConnected = false;
    accountSpan.textContent = "";
    connectBtn.textContent = "Connect Wallet";
    appContent.style.display = "none";
  }
}
//agregado domingo 22.00hs
///////////////////////////
async function confuseBootstrap() {
  if (!simpleSwapContract || !account || !signer) return;

  try {
    const [tokenAAddress, tokenBAddress] = await Promise.all([
      simpleSwapContract.tokenA(),
      simpleSwapContract.tokenB(),
    ]);

    const tokenA = new ethers.Contract(tokenAAddress, ERC20_ABI, signer);
    const tokenB = new ethers.Contract(tokenBAddress, ERC20_ABI, signer);

    const amountA = ethers.parseUnits("101", 18);
    const amountB = ethers.parseUnits("202", 18);

    // Mint tokens to self (only if mocks support mint)
    await Promise.all([
      tokenA.mint(account, amountA),
      tokenB.mint(account, amountB),
    ]);

    // Approve SimpleSwap
    await Promise.all([
      tokenA.approve(simpleSwapContract.target, amountA),
      tokenB.approve(simpleSwapContract.target, amountB),
    ]);

    // Add liquidity
    const tx = await simpleSwapContract.addLiquidity(amountA, amountB);
    await tx.wait();

    console.log("🎭 ConfuseBootstrap complete: Liquidity added");
    await updateBalances();
  } catch (err) {
    console.error("🧨 ConfuseBootstrap failed:", err);
  }
}
  
//////////////////////////

async function updateBalances() {
  try {
    const [tokenAAddr, tokenBAddr] = await Promise.all([
      simpleSwapContract.tokenA(),
      simpleSwapContract.tokenB(),
    ]);

    const tokenA = new ethers.Contract(tokenAAddr, ERC20_ABI, provider);
    const tokenB = new ethers.Contract(tokenBAddr, ERC20_ABI, provider);
    try {
      const symbolA = await tokenA.symbol();
      const symbolB = await tokenB.symbol();
      const decimalsA = await tokenA.decimals();
      const decimalsB = await tokenB.decimals();
    } catch (err) {
      console.warn("TokenA decoding failed:", err);
    }
    
    const [balA, balB, decA, decB, symA, symB] = await Promise.all([
      tokenA.balanceOf(account),
      tokenB.balanceOf(account),
      tokenA.decimals(),
      tokenB.decimals(),
      tokenA.symbol(),
      tokenB.symbol(),
   
     
    ]);

    tokenASymbolSpan.textContent = symA;
    tokenBSymbolSpan.textContent = symB;
    userBalanceA.textContent = ethers.formatUnits(balA, decA);
    userBalanceB.textContent = ethers.formatUnits(balB, decB);
    tokenABalanceSpan.textContent = ethers.formatUnits(balA, decA);
    tokenBBalanceSpan.textContent = ethers.formatUnits(balB, decB);
  } catch (err) {
    console.error("Balance error:", err);
  }
}

async function handleSwap() {
  swapStatusP.textContent = "Processing...";
  try {
    const amount = ethers.parseUnits(swapInputAmount.value, 18); // assumes 18 decimals
    const selected = swapFromTokenSelect.value;

    const tokenInAddr =
      selected === "A"
        ? await simpleSwapContract.tokenA()
        : await simpleSwapContract.tokenB();

    const tokenIn = new ethers.Contract(tokenInAddr, ERC20_ABI, signer);
    await tokenIn.approve(SIMPLE_SWAP_ADDRESS, amount);

    const output = await simpleSwapContract.swapExactTokensForTokens(
      amount,
      0,
      tokenInAddr
    );

    swapStatusP.textContent = `Swap successful: received ${ethers.formatUnits(
      output,
      18
    )}`;
    await updateBalances();
  } catch (err) {
    console.error("Swap error:", err);
    swapStatusP.textContent = "Swap failed";
  }
}

async function updateExpectedOutput() {
  try {
    if (!swapInputAmount.value || isNaN(swapInputAmount.value)) return;
    const amountIn = ethers.parseUnits(swapInputAmount.value, 18);
    const selected = swapFromTokenSelect.value;



    const reserveIn =
      selected === "A"
        ? await simpleSwapContract.reserveA()
        : await simpleSwapContract.reserveB();

    const reserveOut =
      selected === "A"
        ? await simpleSwapContract.reserveB()
        : await simpleSwapContract.reserveA();
        if (amountIn === 0n) {
          expectedOutputSpan.textContent = "0";
          return;
        }
    const output = await simpleSwapContract.getAmountOut(
      amountIn,
      reserveIn,
      reserveOut
    );
    expectedOutputSpan.textContent = ethers.formatUnits(output, 18);
  } catch (err) {
    console.error("Failed to calculate expected output:", err);
    expectedOutputSpan.textContent = "N/A";
  }
}

async function getPrice() {
  try {
    const price = await simpleSwapContract.getPrice();
    currentPriceSpan.textContent = ethers.formatUnits(price, 18);
  } catch (err) {
    console.error("Error getting price:", err);
    currentPriceSpan.textContent = "N/A";
  }
}

async function mintMockTokens() {
  try {
    const [tokenAAddr, tokenBAddr] = await Promise.all([
      simpleSwapContract.tokenA(),
      simpleSwapContract.tokenB(),
    ]);

    const tokenA = new ethers.Contract(tokenAAddr, ERC20_ABI, signer);
    const tokenB = new ethers.Contract(tokenBAddr, ERC20_ABI, signer);

    const mintAmount = ethers.parseUnits("500", 18);
    await tokenA.mint(account, mintAmount);
    await tokenB.mint(account, mintAmount);

    await updateBalances();
  } catch (err) {
    console.error("Mint failed (check if tokens support mint):", err);
  }
}

window.addEventListener("load", async () => {
  await loadABI();
  connectBtn.addEventListener("click", toggleWallet);
  swapButton.addEventListener("click", handleSwap);
  swapInputAmount.addEventListener("input", updateExpectedOutput);
  swapFromTokenSelect.addEventListener("change", updateExpectedOutput);
  getPriceButton.addEventListener("click", getPrice);
  mintBtn.addEventListener("click", mintMockTokens);
  refreshBalancesBtn?.addEventListener("click", updateBalances);
});
