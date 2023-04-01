// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

import "./IAsset.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

// Asset holding a ERC20 token.
contract Erc20TokenAsset is IAsset {

    string private constant version = "0.0.2";

    address tokenAddress;
    address fundAddress;
    string name;

    IUniswapV2Factory private constant uniswapFactory =
        IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
    IUniswapV2Router01 private constant uniswapRouter =
        IUniswapV2Router01(0xf164fC0Ec4E93095b804a4795bBe1e041497b92a);
    IUniswapV2Router02 private constant uniswapRouter2 =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    constructor(address initTokenAddress, address initFundAddress, string memory initName) {
        tokenAddress = initTokenAddress;
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
        return tokenAddress;
    }

    function getTotalBalance() external override(IAsset) view returns (uint) {
        // We calculate ETH value of the token through Uniswap liquidity pair.
        IUniswapV2Pair wethTokenPair = IUniswapV2Pair(uniswapFactory.getPair(uniswapRouter.WETH(), tokenAddress));
        (uint112 wethReserve, uint112 tokenReserve) = getWethPairReservesWethFirst(wethTokenPair);
        uint tokenAmount = IERC20(tokenAddress).balanceOf(address(this));
        uint tokenEthValue = uniswapRouter.quote(tokenAmount, tokenReserve, wethReserve);

        return tokenEthValue + address(this).balance;
    }

    function depositEth() fundOnly external override(IAsset) payable {
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = tokenAddress;
        uniswapRouter.swapExactETHForTokens{ value: msg.value }(
            0,
            path,
            address(this),
            block.timestamp + 60 * 60
        );
    }

    function withdrawEth(uint amount, address payable to) fundOnly external override(IAsset) {
        uint ethBalance = address(this).balance;

        if (ethBalance > 0) {
            if (amount > ethBalance) {
                to.transfer(ethBalance);
            }
            else {
                to.transfer(amount);
                return;
            }
        }

        uint reducedAmount = amount - ethBalance;
        uint tokenAmount = toTokenAmount(reducedAmount);

        // Approve the Uniswap Router to spend the funds from this contract's address.
        IERC20(tokenAddress).approve(address(uniswapRouter2), tokenAmount);

        // Build swap path.
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = uniswapRouter.WETH();

        if (to == fundAddress) {
            // Withdrawing to owning fund => we need to perform 2 jumps:
            // 1. Swap to this asset address.
            // 2. Transfer from this asset address to the fund through the special payable function.
            uniswapRouter2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                tokenAmount,
                0,
                path,
                address(this),
                block.timestamp + 60 * 60
            );
            to.transfer(address(this).balance);
        }
        else {
            // Perform a swap from token to ETH to the given address.
            uniswapRouter2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                tokenAmount,
                0,
                path,
                to,
                block.timestamp + 60 * 60
            );
        }
    }

    function getWethPairReservesWethFirst(
        IUniswapV2Pair pair
    ) internal view returns (uint112 wethReserve, uint112 tokenReserve) {
        (uint112 firstReserve, uint112 secondReserve,) = pair.getReserves();
        address weth = uniswapRouter.WETH();

        if (pair.token0() == weth) {
            wethReserve = firstReserve;
            tokenReserve = secondReserve;
        }
        else if (pair.token1() == weth) {
            wethReserve = secondReserve;
            tokenReserve = firstReserve;
        }
        else {
            revert("Expected WETH to be one of the tokens in pair");
        }
    }

    function toTokenAmount(uint ethAmount) internal view returns (uint) {
        // Use Uniswap liquidity pair to calculate token amount.
        IUniswapV2Pair wethTokenPair = IUniswapV2Pair(uniswapFactory.getPair(uniswapRouter.WETH(), tokenAddress));
        (uint112 wethReserve, uint112 tokenReserve) = getWethPairReservesWethFirst(wethTokenPair);

        return uniswapRouter.quote(ethAmount, wethReserve, tokenReserve);
    }
}
