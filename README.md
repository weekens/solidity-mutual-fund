# Solidity Mutual Fund

This project implements an Ethereum smart contract and a user interface for the zero-trust mutual fund
 [DAO](https://en.wikipedia.org/wiki/Decentralized_autonomous_organization).

The fund contract holds a *treasury* and a list of *members* who can deposit funds to the contract, submit
 *proposals* on managing the fund's treasury and membership, vote on these *proposals* and execute them.
This way the members of the fund collectively manage the investments made by the fund.

The agreement (full or partial) between the members is achieved by means of *voting*.

The voting power of each member is determined by the amount of funds a member has deposited.

The smart contract guarantees each member the possibility to withdraw the deposited funds fully or partially
 at time without other member's agreement.

## Structure of the project

The [`contracts`](./contracts) folder contains the code of the smart contract:

- [`MutualFund.sol`](./contracts/MutualFund.sol) contains the main contract code
- [`IAsset.sol`](./contracts/IAsset.sol) contains the interface for the fund asset smart contracts
- [`MutualFundAsset.sol`](./contracts/MutualFundAsset.sol) contains the default implementation of the fund
 asset smart contract

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
 is blocked; *members* who have voted negatively or restrained have the possibility of a full or partial 
 *exit* during that time
- `founderName`: visual name of the *founder* of a fund

The user who performs the deployment of the fund's smart contract becomes the *founder* of a fund and a first
 *member*.

### Proposals

All changes in the fund are made by means of *proposals*.

Any *member* can submit a *proposal*, which can later be executed if it gets approved by the fund members
 by means of *voting*.

Any *proposal* can only be executed by its author.

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

An *asset* is a smart contract that implements the [`IAsset.sol`](./contracts/IAsset.sol) interface and
 represents a token in the Ethereum blockchain.

The default implementation of an *asset* resides in the
 [`MutualFundAsset.sol`](./contracts/MutualFundAsset.sol) file and can be deployed to the Ethereum blockchain
 with the following initialization parameters:

- `initTokenAddress`: address of a token in the Ethereum blockchain
- `initFundAddress`: address of a fund that will own this asset (certain operations on an asset can only
  be performed by an owning fund and nobody else)
- `initName`: name of this asset (normally equals to the token name or symbol)

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

### Exits

### Voting
