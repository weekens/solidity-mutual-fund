// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

// Asset contract held by the mutual fund.
interface IAsset {

    // @return The balance of the asset.
    function getBalance() external view returns (uint);
}
