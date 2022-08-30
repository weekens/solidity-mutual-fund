// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

// Asset contract held by the mutual fund.
interface IAsset {

    // @return Asset token address.
    function getTokenAddress() external view returns (address);
}
