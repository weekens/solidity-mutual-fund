// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

import "./IAsset.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

// The actual contract for the mutual fund asset.
contract MutualFundAsset is IAsset {

    string private constant version = "0.0.1";

    address tokenAddress;
    address fundAddress;
    string name;

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
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function approve(address spender, uint256 amount) fundOnly external returns (bool) {
        return IERC20(tokenAddress).approve(spender, amount);
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
        // Approve the Uniswap Router to spend the funds from this contract's address.
        IERC20(tokenAddress).approve(address(uniswapRouter2), amount);

        // Perform a swap from token to ETH to the given address.
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = uniswapRouter.WETH();
        uniswapRouter2.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amount,
            0,
            path,
            to,
            block.timestamp + 60 * 60
        );
    }
}
