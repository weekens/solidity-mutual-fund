// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

import "./IAsset.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

// This asset provides liquidity to a Uniswap-compatible contract and
// earns on fees charged by the Uniswap protocol for token pair swaps.
contract UniswapLiquidityPairAsset is IAsset {
    string private constant version = "0.0.1";

    address token1Address;
    address token2Address;
    address fundAddress;
    string name;

    IUniswapV2Factory private constant uniswapFactory =
        IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
    IUniswapV2Router01 private constant uniswapRouter =
        IUniswapV2Router01(0xf164fC0Ec4E93095b804a4795bBe1e041497b92a);
    IUniswapV2Router02 private constant uniswapRouter2 =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    constructor(
        address initToken1Address,
        address initToken2Address,
        address initFundAddress,
        string memory initName
    ) {
        require(initToken1Address != initToken2Address, "Token addresses should not be identical");
        (address sortedToken1Address, address sortedToken2Address) =
            sortTokens(initToken1Address, initToken2Address);
        token1Address = sortedToken1Address;
        token2Address = sortedToken2Address;
        fundAddress = initFundAddress;
        name = initName;
    }

    modifier fundOnly() {
        require(msg.sender == fundAddress, "Only allowed to owning fund");
        _;
    }

    receive() external payable {
        require(
            msg.sender == address(uniswapRouter) || msg.sender == address(uniswapRouter2),
            "Sender is not allowed to deposit funds"
        );
    }

    function getVersion() external override(IAsset) pure returns (string memory) {
        return version;
    }

    function getName() external override(IAsset) view returns (string memory) {
        return name;
    }

    function getTokenAddress() external override(IAsset) view returns (address) {
        return uniswapFactory.getPair(token1Address, token2Address);
    }

    function getTotalBalance() external override(IAsset) view returns (uint) {
        IUniswapV2Pair pair = IUniswapV2Pair(uniswapFactory.getPair(token1Address, token2Address));

        return pair.price0CumulativeLast() + pair.price1CumulativeLast();
    }

    function depositEth() fundOnly external override(IAsset) payable {
        revert("Not implemented");
    }

    function withdrawEth(uint amount, address payable to) fundOnly external override(IAsset) {
        revert("Not implemented");
    }

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }
}