// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract TestUniswap {
    IUniswapV2Factory public factory;

//    constructor(address factory_) public {
    constructor() {
//        factory = factory_;
        factory = IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
    }

//    function getPairInfo(address tokenA, address tokenB) public view returns (uint reserveA, uint reserveB, uint totalSupply) {
//    function getPairInfo() public view returns (uint reserveA, uint reserveB, uint totalSupply) {
//        address tokenA = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
//        address tokenB = 0x5FfbaC75EFc9547FBc822166feD19B05Cd5890bb; // USDC Goerli
//        IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, tokenA, tokenB));
//        totalSupply = pair.totalSupply();
//        (uint reserves0, uint reserves1,) = pair.getReserves();
//        (reserveA, reserveB) = tokenA == pair.token0() ? (reserves0, reserves1) : (reserves1, reserves0);
//
//        return (reserveA, reserveB, totalSupply);
//    }

    function getPairInfo() public view returns (uint) {
        IUniswapV2Pair pair = IUniswapV2Pair(getFirstPairAddress());

        return pair.totalSupply();

//        (uint reserves0, uint reserves1,) = pair.getReserves();
//        (uint reserves0, uint reserves1,) = pair.getReserves();
//
//        return reserves0;
    }

    function getFirstPairAddress() public view returns (address) {
        return factory.allPairs(0);
    }

    function getPairAddress() public view returns (address) {
        address tokenA = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
        address tokenB = 0x5FfbaC75EFc9547FBc822166feD19B05Cd5890bb; // USDC Goerli
//        return UniswapV2Library.pairFor(factory, tokenA, tokenB);

        return factory.getPair(tokenA, tokenB);
    }

    function getTokenSymbol(address token) public view returns (uint) {
        return IERC20(token).totalSupply();
    }
}
