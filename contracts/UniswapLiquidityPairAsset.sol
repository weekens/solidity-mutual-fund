// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

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
        if (token1Address == address(0)) { // Pair with ETH.
            return uniswapFactory.getPair(uniswapRouter.WETH(), token2Address);
        }
        else {
            return uniswapFactory.getPair(token1Address, token2Address);
        }
    }

    function getTotalBalance() external override(IAsset) view returns (uint) {
        uint liquidityAmount = getLiquidityAmount();

        if (liquidityAmount == 0) return 0;

        if (token1Address == address(0)) { // Pair with ETH.
            IUniswapV2Pair pair = IUniswapV2Pair(uniswapFactory.getPair(uniswapRouter.WETH(), token2Address));
            (uint112 token2Reserve, uint112 wethReserve,) = pair.getReserves();
            uint wethAmount = liquidityAmount * uint256(wethReserve) / pair.totalSupply();
            uint token2Amount = liquidityAmount * uint256(token2Reserve) / pair.totalSupply();
            uint token2EthValue = uniswapRouter.quote(token2Amount, token2Reserve, wethReserve);

            return uint256(wethAmount) + uint256(token2EthValue);
        }
        else {
            revert("Not implemented");
        }
    }

    function getLiquidityAmount() public view returns (uint) {
        // Each Uniswap pair contract maintains its own liquidity token that is used to track liquidity
        // of the pool contributors.
        return IERC20(this.getTokenAddress()).balanceOf(address(this));
    }

    function depositEth() fundOnly external override(IAsset) payable {
        if (token1Address == address(0)) { // Create pair with ETH.
            address[] memory path = new address[](2);
            path[0] = uniswapRouter.WETH();
            path[1] = token2Address;
            uint[] memory amounts = uniswapRouter.swapExactETHForTokens{ value: msg.value / 2 }(
                0,
                path,
                address(this),
                block.timestamp + 60 * 60
            );
            IERC20(token2Address).approve(address(uniswapRouter), amounts[1]);
            uniswapRouter.addLiquidityETH{ value: msg.value / 2 }(
                token2Address,
                amounts[1],
                0,
                0,
                address(this),
                block.timestamp + 60 * 60
            );
        }
        else { // Create pair for 2 non-ETH tokens.
            revert("Not implemented");
        }
    }

    function withdrawEth(uint amount, address payable to) fundOnly external override(IAsset) {
        uint liquidityToBurn = this.getLiquidityAmount() * amount / this.getTotalBalance();

        if (token1Address == address(0)) { // Pair with ETH.
            // Remove liquidity.
            // As a result, we get ETH and token2 tokens to this fund's address.
            IERC20(this.getTokenAddress()).approve(address(uniswapRouter), liquidityToBurn);
            (uint token2Amount,) = uniswapRouter.removeLiquidityETH(
                token2Address,
                liquidityToBurn,
                0,
                0,
                address(this),
                block.timestamp + 60 * 60
            );
            // Swap from token 2 to ETH.
            // Approve the Uniswap Router to spend the funds from this contract's address.
            IERC20(token2Address).approve(address(uniswapRouter2), token2Amount);
            // Build swap path.
            address[] memory path = new address[](2);
            path[0] = token2Address;
            path[1] = uniswapRouter.WETH();
            // Perform a swap from token 2 to ETH to this address.
            uniswapRouter2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                token2Amount,
                0,
                path,
                address(this),
                block.timestamp + 60 * 60
            );

            // Send all accumulated ETH to receiver.
            to.transfer(address(this).balance);
        }
        else {
            revert("Not implemented");
        }
    }

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }
}