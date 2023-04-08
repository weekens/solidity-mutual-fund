// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./IAsset.sol";

contract TestAsset is IAsset {
    constructor() {}

    function getVersion() external override(IAsset) pure returns (string memory) {
        return "0.0.1";
    }

    function getName() external override(IAsset) pure returns (string memory) {
        return "TestAsset";
    }

    function getTokenAddress() external override(IAsset) pure returns (address) {
        return address(0);
    }

    function getTotalBalance() external override(IAsset) view returns (uint) {
        return address(this).balance;
    }

    function depositEth() external override(IAsset) payable {}

    function withdrawEth(uint amount, address payable to) external override(IAsset) {
        to.transfer(amount);
    }
}
