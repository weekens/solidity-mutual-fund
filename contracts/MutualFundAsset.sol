// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

import "./IAsset.sol";

// The actual contract for the mutual fund asset.
contract MutualFundAsset is IAsset {

    address tokenAddress;

    constructor(address initTokenAddr) {
        tokenAddress = initTokenAddr;
    }

    function getTokenAddress() external override(IAsset) view returns (address) {
        return tokenAddress;
    }
}
