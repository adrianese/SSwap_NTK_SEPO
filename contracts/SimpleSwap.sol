// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SimpleSwap
 * @author ASeri
 * @notice Simplified AMM contract similar to Uniswap V2 for a single pair of tokens.
 * Allows operations for adding liquidity, removing liquidity, and token swaps.
 * Additionally, it provides methods to check the price and calculate the output amount in a swap.
 */

contract SimpleSwap is ERC20 {
    using SafeERC20 for IERC20;

    // Addresses of the tokens involved in the pool
    IERC20 public tokenA;
    IERC20 public tokenB;
    
    // RESERVES: tokenA => tokenB => reserves
    uint256 public reserveA;
    uint256 public reserveB;

    /// @notice The constructor initializes the contract with the addresses of tokenA and tokenB.
    /// Inherits ERC20 to issue the liquidity token (LQT).
    //constructor(address _tokenA, address _tokenB) ERC20("Liquidity Token", "LQT") {
       // tokenA = IERC20(_tokenA);
      //  tokenB = IERC20(_tokenB);}
        //constructor 2
    constructor() ERC20("Liquidity Token", "LQT") {}

    function initializeTokens(address _tokenA, address _tokenB) external {
        require(address(tokenA) == address(0), "Already initialized");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
}

    /// @notice Adds liquidity to the pool.
    /// @param amountA Amount of tokenA the user deposits.
    /// @param amountB Amount of tokenB the user deposits.
    /// @return liquidityMinted The amount of liquidity tokens minted.
    
    function addLiquidity(uint256 amountA, uint256 amountB)
        external 
        returns (uint256 liquidityMinted)
    {
        // Tokens are transferred from the EOA (user must have approved previously)
        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);

        uint256 totalLiquidity = totalSupply();
        // If it's the first provider (empty pool), use the square root as seed
        if (totalLiquidity == 0) {
            liquidityMinted = Math.sqrt(amountA * amountB);
        } else {
            // For later deposits, proportionality is maintained
            uint256 liquidityA = (amountA * totalLiquidity) / reserveA;
            uint256 liquidityB = (amountB * totalLiquidity) / reserveB;
            liquidityMinted = liquidityA < liquidityB ? liquidityA : liquidityB;
        }
        require(liquidityMinted > 0, "Insufficient liquidity");

        _mint(msg.sender, liquidityMinted);

        // Update contract reserves
        reserveA += amountA;
        reserveB += amountB;
    }

    /// @notice Removes liquidity from the pool by burning liquidity tokens.
    /// @param liquidity Amount of liquidity tokens to burn.
    /// @return amountAOut Amount of tokenA returned.
    /// @return amountBOut Amount of tokenB returned.

    function removeLiquidity(uint256 liquidity)
        external
        returns (uint256 amountAOut, uint256 amountBOut)
    {
        uint256 totalLiquidity = totalSupply();
        require(liquidity > 0 && liquidity <= totalLiquidity, "Invalid liquidity");

        // Calculate the amount of each token to withdraw, proportional to liquidity
        amountAOut = (liquidity * reserveA) / totalLiquidity;
        amountBOut = (liquidity * reserveB) / totalLiquidity;
        require(amountAOut > 0 && amountBOut > 0, "Insufficient to withdraw");

        _burn(msg.sender, liquidity);

        // Update reserves
        reserveA -= amountAOut;
        reserveB -= amountBOut;
        
        // Transfer tokens to the user
        tokenA.safeTransfer(msg.sender, amountAOut);
        tokenB.safeTransfer(msg.sender, amountBOut);
    }

    /// @notice Executes an exact token-for-token swap.
    /// @param amountIn Amount of tokens the user sends in.
    /// @param amountOutMin Minimum expected amount out (slippage protection).
    /// @param tokenIn Address of the token to swap in (must be tokenA or tokenB).
    /// @return amountOut Amount of the output token received.

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn
    ) external returns (uint256 amountOut) {
        // Validate that tokenIn is one of the pool tokens
        require(
            tokenIn == address(tokenA) || tokenIn == address(tokenB),
            "Invalid token"
        );

        // Determine which token is the output token
        bool isTokenAIn = (tokenIn == address(tokenA));
        IERC20 tokenInput = isTokenAIn ? tokenA : tokenB;
        IERC20 tokenOutput = isTokenAIn ? tokenB : tokenA;
        uint256 reserveIn = isTokenAIn ? reserveA : reserveB;
        uint256 reserveOut = isTokenAIn ? reserveB : reserveA;

        // Transfer input token from user to contract
        tokenInput.safeTransferFrom(msg.sender, address(this), amountIn);

        // Calculate amount to receive using the formula:
        // amountOut = amountIn * reserveOut / (reserveIn + amountIn)

        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "Slippage: Less than minimum");

        // Transfer output token to user
        tokenOutput.safeTransfer(msg.sender, amountOut);

        // Update pool reserves
        if (isTokenAIn) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }
    }

    /// @notice Returns the current "price" of tokenA in terms of tokenB.
    /// For better precision, result is multiplied by 1e18.

    function getPrice() external view returns (uint256 price) {
        require(reserveA > 0, "No liquidity in tokenA");
        price = (reserveB * 1e18) / reserveA;
    }
        
    /// @notice Calculates the output amount for a swap.
    /// @param amountIn Amount of token sent.
    /// @param reserveIn Input token reserve in the pool.
    /// @param reserveOut Output token reserve in the pool.
    /// @return amountOut The amount the user will receive.

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input amount");
        require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");
        // Simple formula: amountOut = amountIn * reserveOut / (reserveIn + amountIn)
        amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
    }
}