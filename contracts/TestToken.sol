
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _mint(msg.sender, 1_000_000 ether);
        _decimals = decimals_;
    }

    uint8 private _decimals;

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}