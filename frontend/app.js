let signer;
let account;
let simpleSwapContract;
let SimpleSwapArtifact;

// Replace with your deployed contract address
const SIMPLE_SWAP_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// UI Elements
const connectWalletBtn = document.getElementById("connect-wallet-btn");
const walletStatusDiv = document.getElementById("wallet-status");
const appContentDiv = document.getElementById("app-content");
const accountAddressSpan = document.getElementById("account-address");
const swapInputAmount = document.getElementById("swap-input-amount");
const swapFromTokenSelect = document.getElementById("swap-from-token");
const swapButton = document.getElementById("swap-button");
const swapStatusP = document.getElementById("swap-status");
const expectedOutputSpan = document.getElementById("expected-output");
const priceInputAmount = document.getElementById("price-input-amount");
const priceFromTokenSelect = document.getElementById("price-from-token");
const getPriceButton = document.getElementById("get-price-button");
const currentPriceSpan = document.getElementById("current-price");

let provider;

// Load contract ABI from ABI folder
async function loadContractABI() {
  const response = await fetch("./ABI/SimpleSwap.json");
  SimpleSwapArtifact = await response.json();
}

// Update UI connection status
function updateUIConnected(isConnected) {
  if (isConnected) {
    walletStatusDiv.classList.add("connected");
    walletStatusDiv.innerHTML = `<p>Wallet Connected</p>`;
    appContentDiv.style.display = "block";
  } else {
    walletStatusDiv.classList.remove("connected");
    walletStatusDiv.innerHTML = `<p>Wallet Not Connected</p><button id="connect-wallet-btn">Connect Wallet</button>`;
    document
      .getElementById("connect-wallet-btn")
      .addEventListener("click", connectWallet);
    appContentDiv.style.display = "none";
  }
}

// Connect wallet and initialize contract
async function connectWallet() {
  if (window.ethereum) {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
      account = await signer.getAddress();
      accountAddressSpan.textContent = account;

      updateUIConnected(true);

      simpleSwapContract = new ethers.Contract(
        SIMPLE_SWAP_ADDRESS,
        SimpleSwapArtifact.abi,
        signer
      );

      setupEventListeners();
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Unable to connect. Make sure MetaMask is installed and unlocked.");
      updateUIConnected(false);
    }
  } else {
    alert("MetaMask not detected. Please install it to use this dApp.");
    updateUIConnected(false);
  }
}

// Register event listeners for UI and wallet events
function setupEventListeners() {
  swapButton.addEventListener("click", handleSwap);
  getPriceButton.addEventListener("click", getPrice);
  swapInputAmount.addEventListener("input", updateExpectedOutput);
  swapFromTokenSelect.addEventListener("change", updateExpectedOutput);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", async (newAccounts) => {
      if (newAccounts.length === 0) {
        updateUIConnected(false);
      } else {
        signer = await provider.getSigner();
        account = newAccounts[0];
        accountAddressSpan.textContent = account;
      }
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
}

// Start the app once page loads
window.addEventListener("load", async () => {
  await loadContractABI();

  if (window.ethereum && window.ethereum.selectedAddress) {
    await connectWallet();
  } else {
    updateUIConnected(false);
    connectWalletBtn.addEventListener("click", connectWallet);
  }
});


// Updates the estimated output based on user input
async function updateExpectedOutput() {
    const amount = swapInputAmount.value;
    const fromToken = swapFromTokenSelect.value;
  
    if (!amount || parseFloat(amount) <= 0) {
      expectedOutputSpan.textContent = "0";
      return;
    }
  
    if (!simpleSwapContract) {
      expectedOutputSpan.textContent = "Wallet must be connected.";
      return;
    }
  
    try {
      const parsedAmount = ethers.parseEther(amount);
      const expected = await simpleSwapContract.getAmountOutWrapper(parsedAmount, fromToken);
      expectedOutputSpan.textContent = ethers.formatEther(expected);
    } catch (error) {
      console.error("Failed to calculate expected output:", error);
      expectedOutputSpan.textContent = "Error";
    }
  }
  
  // Handles swap execution by calling the appropriate contract method
  async function handleSwap() {
    const amount = swapInputAmount.value;
    const fromToken = swapFromTokenSelect.value;
  
    if (!amount || parseFloat(amount) <= 0) {
      swapStatusP.textContent = "Please enter a valid amount.";
      return;
    }
  
    if (!signer || !simpleSwapContract) {
      swapStatusP.textContent = "Wallet not connected or contract unavailable.";
      return;
    }
  
    swapStatusP.textContent = "Processing swap...";
    swapButton.disabled = true;
  
    try {
      const parsedAmount = ethers.parseEther(amount);
      const tx = await simpleSwapContract.swapExactTokensForTokens(
        parsedAmount,
        0, // You might want to add slippage logic here later
        fromToken === "A" ? tokenAAddress : tokenBAddress
      );
      await tx.wait();
  
      swapStatusP.textContent = "Swap completed successfully.";
      expectedOutputSpan.textContent = "0";
    } catch (error) {
      console.error("Swap failed:", error);
      swapStatusP.textContent = `Swap failed: ${error.message || error}`;
    } finally {
      swapButton.disabled = false;
    }
  }
  
  // Queries output amount without executing swap
  async function getPrice() {
    const amount = priceInputAmount.value;
    const fromToken = priceFromTokenSelect.value;
  
    if (!amount || parseFloat(amount) <= 0) {
      currentPriceSpan.textContent = "Enter amount.";
      return;
    }
  
    if (!simpleSwapContract) {
      currentPriceSpan.textContent = "Wallet must be connected.";
      return;
    }
  
    try {
      const parsedAmount = ethers.parseEther(amount);
      const price = await simpleSwapContract.getAmountOutWrapper(parsedAmount, fromToken);
      currentPriceSpan.textContent = ethers.formatEther(price);
    } catch (error) {
      console.error("Error getting price:", error);
      currentPriceSpan.textContent = "Unable to retrieve price.";
    }
  }