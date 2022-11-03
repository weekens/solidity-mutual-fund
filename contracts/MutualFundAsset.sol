// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

import "./IAsset.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// The actual contract for the mutual fund asset.
contract MutualFundAsset is IAsset {

    address tokenAddress;
    address fundAddress;

    constructor(address initTokenAddress, address initFundAddress) {
        tokenAddress = initTokenAddress;
        fundAddress = initFundAddress;
    }

    modifier fundOnly() {
        require(msg.sender == fundAddress, "Only allowed to owning fund");
        _;
    }

    function getTokenAddress() external override(IAsset) view returns (address) {
        return tokenAddress;
    }

    function getTotalBalance() external override(IAsset) view returns (uint) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function approve(address spender, uint256 amount) fundOnly external returns (bool) {
        return IERC20(tokenAddress).approve(spender, amount);
    }
}
