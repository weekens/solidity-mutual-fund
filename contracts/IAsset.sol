// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

// Asset contract held by the mutual fund.
interface IAsset {

    // @return Asset contract version.
    function getVersion() external view returns (string memory);

    // @return Asset name.
    function getName() external view returns (string memory);

    // @return Asset token address.
    function getTokenAddress() external view returns (address);

    // @return Total balance of the asset in the fund.
    function getTotalBalance() external view returns (uint);

    // Approves a spender to spend a given amount from this asset's balance according to ERC20.
    function approve(address spender, uint256 amount) external returns (bool);

    // Deposits a given amount of ETH from an owning fund to this asset.
    function depositEth() external payable;

    // Withdraws a given amount of ETH to a given address.
    // Amount is passed as msg.value.
    function withdrawEth(uint amount, address payable to) external;
}
