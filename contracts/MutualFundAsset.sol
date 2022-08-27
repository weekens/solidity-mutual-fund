// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

import "./IAsset.sol";

// The actual contract for the mutual fund asset.
contract MutualFundAsset is IAsset {

    address addr;

    constructor(address initAddr) {
        addr = initAddr;
    }

    function getBalance() external override(IAsset) view returns (uint) {
        return addr.balance;
    }
}
