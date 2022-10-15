// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

import "./IAsset.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// The actual contract for the mutual fund asset.
contract MutualFundAsset is IAsset {

    address tokenAddress;

    constructor(address initTokenAddr) {
        tokenAddress = initTokenAddr;
    }

    function getTokenAddress() external override(IAsset) view returns (address) {
        return tokenAddress;
    }

    function getTotalBalance() external override(IAsset) view returns (uint) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        return IERC20(tokenAddress).approve(spender, amount);
    }
}
