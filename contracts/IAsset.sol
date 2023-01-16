// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

// Asset contract held by the mutual fund.
interface IAsset {

    // @return Asset name.
    function getName() external view returns (string memory);

    // @return Asset token address.
    function getTokenAddress() external view returns (address);

    // @return Total balance of the asset in the fund.
    function getTotalBalance() external view returns (uint);

    // Approves a spender to spend a given amount from this asset's balance according to ERC20.
    function approve(address spender, uint256 amount) external returns (bool);
}
