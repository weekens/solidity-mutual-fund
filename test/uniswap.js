const TestToken = artifacts.require('TestToken');
const { ethers, providers } = require('ethers');
const UniswapV2Factory = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const TruffleContract = require("@truffle/contract");
const expect = require('chai').expect;
const truffleAssert = require('truffle-assertions');

contract('TestUniswap', (accounts) => {

  it('should create a new pair', async () => {
    const token1 = await TestToken.new();
    const token2 = await TestToken.new();
    const web3Provider = new providers.Web3Provider(web3.currentProvider);
    const signer = web3Provider.getSigner(accounts[0]);
    const uniswapFactoryFactory = new ethers.ContractFactory(UniswapV2Factory.abi, UniswapV2Factory.bytecode, signer);
    const uniswapFactory = await uniswapFactoryFactory.deploy(accounts[0]);

    await uniswapFactory.deployTransaction.wait();

    const createPairTx = await uniswapFactory.createPair(
      token1.address,
      token2.address,
      { from: accounts[0] }
    );

    console.log('createPairTx =', createPairTx);

    const createPairResult = await createPairTx.wait();

    console.log('createPairResult =', createPairResult);

    const filter = uniswapFactory.filters.PairCreated();
    const events = await uniswapFactory.queryFilter(filter, -10, "latest");

    console.log('events = ', events);

    const pairAddress = events[0].args.pair;

    console.log('pairAddress =', pairAddress);

    expect(pairAddress).to.not.be.null;
  });

  it('should create a new pair with Truffle/contract', async () => {
    const token1 = await TestToken.new();
    const token2 = await TestToken.new();
    const web3Provider = web3.currentProvider;
    const uniswapFactoryContract = await TruffleContract(UniswapV2Factory);
    uniswapFactoryContract.setProvider(web3Provider);

    const uniswapFactory = await uniswapFactoryContract.new(accounts[0], { from: accounts[0] });

    const createPairTx = await uniswapFactory.createPair(
      token1.address,
      token2.address,
      { from: accounts[0] }
    );

    console.log('createPairTx =', createPairTx);

    truffleAssert.eventEmitted(
      createPairTx,
      "PairCreated",
      (ev) => {
        return !!ev.pair;
      }
    );
  });
});
