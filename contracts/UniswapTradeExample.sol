pragma solidity ^0.8.9;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//interface IUniswap {
//    function swapExactETHForTokens(
//        uint amountOutMin,
//        address[] calldata path,
//        address to,
//        uint deadline)
//    external
//    payable
//    returns (uint[] memory amounts);
//    function WETH() external pure returns (address);
//}

contract UniswapTradeExample {
    IUniswapV2Router02 private uniswap = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    function swapExactETHForTokens(uint amountOutMin, address token) external payable {
        address[] memory path = new address[](2);
        path[0] = uniswap.WETH();
        path[1] = token;
        uniswap.swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );
    }

    function swapBack(address token, uint amount, address to) external {
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = uniswap.WETH();
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(uniswap), amount);
        uniswap.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amount,
            0,
            path,
            payable(to),
            block.timestamp + 60 * 60
        );
    }
}
