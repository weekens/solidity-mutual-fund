# Solidity Mutual Fund

![](images/solidity-mutual-fund-purpose.jpg)

This project implements an Ethereum smart contract and a user interface for the zero-trust mutual fund
 [DAO](https://en.wikipedia.org/wiki/Decentralized_autonomous_organization).

The fund contract holds a *treasury* and a list of *members* who can deposit funds to the contract, submit
 *proposals* on managing the fund's treasury and membership, vote on these *proposals* and execute them.
This way the members of the fund collectively manage the investments made by the fund.

The agreement (full or partial) between the members is achieved by means of *voting*.

The voting power of each member is determined by the amount of funds a member has deposited.

The smart contract guarantees each member the possibility to withdraw the deposited funds fully or partially
 at any time without other member's agreement.

## Structure of the project

The [`contracts`](./contracts) folder contains the code of the smart contract:

- [`MutualFund.sol`](./contracts/MutualFund.sol) contains the main contract code
- [`IAsset.sol`](./contracts/IAsset.sol) contains the interface for the fund asset smart contracts
- [`Erc20TokenAsset.sol`](./contracts/Erc20TokenAsset.sol) contains the default implementation of the fund
 asset smart contract
- [`UniswapLiquidityPairAsset.sol`](./contracts/UniswapLiquidityPairAsset.sol) contains the Uniswap liquidity
 pair asset smart contract
- [`TestAsset.sol`](./contracts/TestAsset.sol) contains a special asset smart contract used for testing purposes only

The [`frontend`](./frontend) folder contains the implementation code for the fund's Web3 user interface.

The [`scripts`](./scripts) folder contains the helper scripts.

The [`test`](./test) folder contains the automated tests for the smart contract.

## Using the fund contract

This section covers the logic of the fund's smart contract with the references to the corresponding functions.

### Initialization

During the initial deployment, the fund is initialized with a `Configuration` object that contains the
 following fields:

- `proposalExpiryPeriod`: time in seconds after a *proposal* submission, when a *proposal* gets expired
- `votingPeriod`: time in seconds after a *proposal* submission during which the *voting* is open
- `gracePeriod`: time in seconds after the end of voting on a *proposal* during which the proposal execution
 is blocked; *members* who have voted negatively or refrained have the possibility of a full or partial 
 *exit* during that time
- `founderName`: visual name of the *founder* of a fund

The user who performs the deployment of the fund's smart contract becomes the *founder* of a fund and a first
 *member*.

### Proposals

All changes in the fund are made by means of *proposals*.

Any *member* can submit a *proposal*, which can later be executed if it gets approved by the fund members
 by means of *voting*.

Any *proposal* can only be executed by its author.

A proposal is submitted with the `submitProposal` contract function, and is executed with the
 `executeProposal` contract function.

A *proposal* has the following parameters:

- `proposalType`: type of proposal (see below)
- `name`: member name (for `AddMember` proposal type)
- `amount`: amount of funds in WEI (for `DepositFunds` and `Swap` proposal types); number of seconds (for
  `ChangeVotingPeriod`, `ChangeGracePeriod`, or `ChangeProposalExpiryPeriod` proposal types)
- `addresses`: from and to addresses (for `Swap` proposal type); address of an asset contract (for
  `AddAsset` proposal type)

Below are the possible *proposal* types:

- `DepositFunds`
- `AddMember`
- `AddAsset`
- `Swap`
- `KickMember`
- `ChangeVotingPeriod`
- `ChangeGracePeriod`
- `ChangeProposalExpiryPeriod`

These proposal types are explained in more detail in the sections below.

#### `DepositFunds`

Funds are initially deposited to the fund contract with a `DepositFunds` proposal.

A *member* submits a `DepositFunds` *proposal*, specifying how much ETH they would like to deposit in the 
 `amount` parameter.

After a *proposal* gets approved, a proposal author executes it and pays exactly the amount that was
 specified in the `amount` parameter (in other cases a transaction gets rejected).

After the funds get deposited, a proposal author receives the amount of fund *tokens* equal to the amount of
 ETH that was deposited (which sum up with the amount of *tokens* a *member* already has).
The amount of *tokens* a *member* owns defines the voting power of a *member*.

#### `AddMember`

New *members* can be added to the fund only by means of an `AddMember` proposal.

The address of a new member is defined by the first and the only address in the `addresses` parameter.
The visual name of a new *member* is defined by the `name` parameter.

The execution of a *proposal* adds a member with the given address and visual name to the fund.
The new member initially has zero *tokens*, but has the right to submit *proposals* (including
 `DepositFunds`).

#### `AddAsset`

If the fund would only hold the deposited ETH without doing anything with it, it would be useless.
Instead, the fund's smart contract provides the possibility to hold various *assets* in the treasury and
 transfer the funds between these *assets*.

An *asset* is a smart contract that implements the [`IAsset`](./contracts/IAsset.sol) interface and
 represents a token or other type of value asset in the Ethereum blockchain.

Once the *asset* is deployed, it can be added to the fund by means of an `AddAsset` proposal, where the
 `addresses` parameter contains the address of a deployed *asset* contract as the first and the only
 parameter.

#### `Swap`

Transferring funds between the *assets* by means of converting one token to another is how a fund actually
 implements its investment strategy.
This transfer and conversion is performed by executing a `Swap` proposal.

A `Swap` proposal takes the amount of funds specified in the `amount` parameter from the *asset* with the
 first address in the `addresses` parameter and converts them into the token of the *asset* with the second
 address in the `addresses` parameter by using the [Uniswap](https://uniswap.org/) DEX smart contract.

For example, the *members* may decide to spend 50% of the money in the fund to buy a SushiSwap token (SUSHI).
To do this, they:
1. Deploy an *asset* that points to the address of SUSHI token
 (`0x6B3595068778DD592e39A122f4f5a5cF09C90fE2` in Mainnet).
2. Add the SUSHI *asset* to the fund by executing an `AddAsset` proposal.
3. Execute a `Swap` proposal with the following parameters:
  - `amount` = actual value that corresponds to the 50% of the funds in ETH
  - `addresses`: first address = address of the fund itself; second address = address of the SUSHI *asset*

If the price in ETH of a purchased token grows over time, the fund gains money; if it shrinks, the fund
 looses.
But the amount of tokens each *member* owns remains unchanged.

#### `KickMember`

The *members* may decide to remove a certain *member* from the fund by means of submitting a `KickMember`
 *proposal*, *voting* for this *proposal*, and executing it.

The funds the kicked *member* owns are automatically returned to this member according to the share of tokens
 he/she owns (the full *exit* is done).

A `KickMember` *proposal* expects the address of the kicked *member* as a first and only address in the
 `addresses` parameter.

#### `ChangeVotingPeriod`, `ChangeGracePeriod`, `ChangeProposalExpiryPeriod`

These types of *proposals* change the current configuration of the fund, interpreting a value in the
 `amount` parameter as a number of seconds and applying it to the respective configuration parameter.

### Exits

Any *member* can withdraw their money from the fund at any time (this is called *exit*).
No approval from other *members* is required for that.

The amount of funds that can be withdrawn with the *exit* is determined by the amount of tokens a *member*
 has.
This is done the following way:

1. The amount of *member's* *tokens* is divided by the total amount of *tokens* in the fund resulting in the
 fraction F.
2. In each of the fund's *assets*, a *member* owns the fraction F of the total amount of tokens.
3. In the fund itself, a *member* owns the fraction F of the total amount of ETH.

The *exit* may be full (take 100% of owned funds) or partial (take less than 100% of owned funds).

After a full *exit*, an exiting *member* is automatically kicked from the fund.

The *exit* is performed by the `exit` contract function.

### Voting

A submitted *proposal* can only be executed after it successfully passes the *voting* procedure.
For this to happen, the following condition must be reached: after a voting period, the sum of the *tokens* of
 the *members* who have voted positively must be greater than the sum of the *tokens* of the *members* who
 voted negatively.

A *proposal* author - a *member* who has submitted a *proposal* - is automatically recorded as a positive
 voter for this *proposal*.
Other members are not required to vote and may refrain.

If all *members* have submitted votes for a *proposal* a voting period ends automatically.

If all *members* have submitted votes for a *proposal* and all votes are positive, there is no grace period
 for this proposal.

If some *members* have refrained or there is at least one negative vote, a grace period takes place after
 a voting period.
During the grace period a *proposal* cannot be executed, and *members* have the chance to *exit* fully
 or partially.

The *voting* is done with the `vote` contract function.

### Assets

To connect an *asset* to the fund with the `AddAsset` proposal, one should deploy the asset contract to the
 blockchain first.
As mentioned in [`AddAsset`](#addasset) section, the *asset* contract should implement the
 [`IAsset`](./contracts/IAsset.sol) interface.

This repository provides 2 implementations of the asset contract, covered below.

#### [`Erc20TokenAsset`](./contracts/Erc20TokenAsset.sol)

This is an implementation of a single ERC20 token *asset*.

The contract is deployed to the Ethereum blockchain with the following initialization parameters:

- `initTokenAddress`: address of a token in the Ethereum blockchain
- `initFundAddress`: address of a fund that will own this asset (certain operations on an asset can only
  be performed by an owning fund and nobody else)
- `initName`: name of this asset (normally equals to the token name or symbol)

#### [`UniswapLiquidityPairAsset`](./contracts/UniswapLiquidityPairAsset.sol)

This *asset* represents a liquidity pair in Uniswap-compatible DEX.
The *asset* accepts ETH and automatically converts it to the tokens of the pair with Uniswap swap functions,
 and provides liquidity to the DEX, earning commissions from the exchange.

The contract is deployed to the Ethereum blockchain with the following initialization parameters:

- `initToken1Address`: address of a fist token used in the liquidity pair, or zero address, if it is ETH
- `initToken2Address`: address of a second token used in the liquidity pair, or zero address, if it is ETH
- `initFundAddress`: address of a fund that will own this asset (certain operations on an asset can only
  be performed by an owning fund and nobody else)
- `initName`: name of this asset (normally equals to the token name or symbol)

## Development

To initialize the project repository for development, run the `npm ci` command in the root directory and in
 the `frontend` directory.

To execute the tests for the smart contract, run:

```bash
npm test
```

To deploy the smart contract to the Goerli Testnet:

1. Create a `.env` file in the root directory of the project.
2. Configure the `API_URL=your_alchemy_api_url` and `PRIVATE_KEY=your_ethereum_wallet_private_key` in
 `.env` file.
3. Run `npm run deploy-contracts-testnet`; the address of the deployed contract will be printed to the 
 console.

To start the Web3 UI in the development mode:

1. Create a `.env` file in the `frontend` directory of the project.
2. Configure the `REACT_APP_CONTRACT_ADDRESS=deployed_contract_address` in the `.env` file of the `frontend`
 directory.
3. Run `npm start` in the `frontend` directory or in the root directory of the project.
