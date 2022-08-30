pragma solidity ^0.8.9;

interface IUniswap {
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline)
    external
    payable
    returns (uint[] memory amounts);
    function WETH() external pure returns (address);
}

contract UniswapTradeExample {
    IUniswap uniswap;

    // Pass in address of UniswapV2Router02
    constructor(address _uniswap) {
        uniswap = IUniswap(_uniswap);
    }

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
}
