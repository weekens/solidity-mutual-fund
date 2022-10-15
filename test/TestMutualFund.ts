import { expect } from "chai";
import { ethers } from "hardhat";
import { MutualFund } from "../typechain-types";
import { BigNumber, BigNumberish } from "ethers";
const ERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");

enum ProposalType {
    DepositFunds,
    AddAsset,
    Swap,
    AddMember
}

describe("MutualFund", function () {

    it("should add sender to members upon creation", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy();

        const members = await fund.getMembers();

        expect(members).to.have.lengthOf(1);

        const [signer] = await ethers.getSigners();

        const member = members.find(elem => elem.addr === signer.address);

        expect(member).to.not.be.null;
    });

    it("should be able to deposit funds with proposal", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy();
        const [signer] = await ethers.getSigners();

        const proposalId = await submitProposal(
            fund,
            signer.address,
            {
                proposalType: ProposalType.DepositFunds,
                amount: 20,
                addresses: []
            }
        );

        await voteForProposal(
            fund,
            signer.address,
            proposalId
        );

        // Try to send wrong sum.
        await expect(
            fund.executeProposal(
                proposalId,
                { from: signer.address, value: 200 }
            )
        ).to.revertedWith("The sent funds amount differs from proposed");

        const beginningFundBalance = await ethers.provider.getBalance(fund.address);
        const beginningMemberBalance = (await fund.getMember(signer.address)).balance;
        const beginningAccountBalance = await ethers.provider.getBalance(signer.address);

        // Send the right sum.
        await expect(
            fund.executeProposal(
                proposalId,
                { from: signer.address, value: 20 }
            )
        ).to.emit(fund, "ProposalExecuted").withArgs(proposalId);

        const endingFundBalance = await ethers.provider.getBalance(fund.address);

        expect(endingFundBalance).to.be.equal(beginningFundBalance.add(20));

        const endingMemberBalance = (await fund.getMember(signer.address)).balance;

        expect(endingMemberBalance).to.be.equal(beginningMemberBalance.add(20));

        const endingAccountBalance = await ethers.provider.getBalance(signer.address);

        expect(endingAccountBalance).to.be.lessThanOrEqual(beginningAccountBalance.sub(20)); // Include gas price.

        const proposalsAfter = await fund.getProposals();

        expect(proposalsAfter).to.have.lengthOf(0);
    });

    it("should be able to exit with funds", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy();
        const [signer] = await ethers.getSigners();

        await depositFunds(fund, signer.address, 1000);

        const beginningFundBalance = await ethers.provider.getBalance(fund.address);

        expect(beginningFundBalance.toNumber()).to.be.equal(1000);

        const memberBalanceBeforeExit = (await fund.getMember(signer.address)).balance;

        expect(memberBalanceBeforeExit.toNumber()).to.be.equal(1000);

        // Try to exit with wrong sum.
        await expect(
            fund.exit(120)
        ).to.revertedWith("Invalid percentage value");

        const signerBalanceBeforeExit = await ethers.provider.getBalance(signer.address);

        // Member performs partial exit (60%).
        const partialExitTx = await fund.exit(60);
        const partialExitResult = await partialExitTx.wait();
        const partialExitGasUsed = partialExitResult.effectiveGasPrice.mul(partialExitResult.cumulativeGasUsed);
        const partialExitEvent = partialExitResult.events?.find(evt => evt.event === "Exit")

        expect(partialExitEvent).to.not.be.undefined;

        const partialExitToReturn = partialExitEvent?.args?.["toReturn"];
        const fundMembersAfterPartialExit = await fund.getMembers();

        expect(fundMembersAfterPartialExit).to.have.lengthOf(1);

        const memberBalanceAfterPartialExit = (await fund.getMember(signer.address)).balance;

        expect(memberBalanceAfterPartialExit.toNumber()).to.be.equal(400);

        const fundBalanceAfterPartialExit = await ethers.provider.getBalance(fund.address);

        expect(fundBalanceAfterPartialExit.eq(beginningFundBalance.sub(partialExitToReturn))).to.be.true;

        const signerBalanceAfterPartialExit = await ethers.provider.getBalance(signer.address);
        const partialExitCalcResult = signerBalanceBeforeExit.sub(partialExitGasUsed).add(partialExitToReturn);

        expect(signerBalanceAfterPartialExit.eq(partialExitCalcResult)).to.be.true;

        // Member performs full exit (100%).
        const fullExitTx = await fund.exit(100);
        const fullExitResult = await fullExitTx.wait();
        const fullExitGasUsed = fullExitResult.effectiveGasPrice.mul(fullExitResult.cumulativeGasUsed);
        const fullExitEvent = fullExitResult.events?.find(evt => evt.event === "Exit")

        expect(fullExitEvent).to.not.be.undefined;

        const fullExitToReturn = fullExitEvent?.args?.["toReturn"];
        const fundMembersAfterFullExit = await fund.getMembers();

        expect(fundMembersAfterFullExit).to.have.lengthOf(0);

        const fundBalanceAfterFullExit = await ethers.provider.getBalance(fund.address);

        expect(fundBalanceAfterFullExit.toNumber()).to.be.equal(0);

        const signerBalanceAfterFullExit = await ethers.provider.getBalance(signer.address);
        const fullExitCalcResult = signerBalanceAfterPartialExit.sub(fullExitGasUsed).add(fullExitToReturn);

        expect(signerBalanceAfterFullExit.eq(fullExitCalcResult)).to.be.true;
    });

    it("should be able to exit with funds (big sums)", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy();
        const [signer] = await ethers.getSigners();

        const depositAmount = ethers.utils.parseEther("100");

        await depositFunds(fund, signer.address, depositAmount);

        const beginningFundBalance = await ethers.provider.getBalance(fund.address);

        expect(beginningFundBalance.eq(depositAmount)).to.be.true;

        const memberBalanceBeforeExit = (await fund.getMember(signer.address)).balance;

        expect(memberBalanceBeforeExit.eq(depositAmount)).to.be.true;

        const signerBalanceBeforeExit = await ethers.provider.getBalance(signer.address);

        // Member performs partial exit (60%).
        const partialExitTx = await fund.exit(60);
        const partialExitResult = await partialExitTx.wait();
        const partialExitGasUsed = partialExitResult.effectiveGasPrice.mul(partialExitResult.cumulativeGasUsed);
        const partialExitEvent = partialExitResult.events?.find(evt => evt.event === "Exit")

        expect(partialExitEvent).to.not.be.undefined;

        const partialExitToReturn = partialExitEvent?.args?.["toReturn"];
        const fundMembersAfterPartialExit = await fund.getMembers();

        expect(fundMembersAfterPartialExit).to.have.lengthOf(1);

        const memberBalanceAfterPartialExit = (await fund.getMember(signer.address)).balance;

        expect(memberBalanceAfterPartialExit.eq(ethers.utils.parseEther("40"))).to.be.true;

        const fundBalanceAfterPartialExit = await ethers.provider.getBalance(fund.address);

        expect(fundBalanceAfterPartialExit.eq(beginningFundBalance.sub(partialExitToReturn))).to.be.true;

        const signerBalanceAfterPartialExit = await ethers.provider.getBalance(signer.address);
        const partialExitCalcResult = signerBalanceBeforeExit.sub(partialExitGasUsed).add(partialExitToReturn);

        expect(signerBalanceAfterPartialExit.eq(partialExitCalcResult)).to.be.true;

        // Member performs full exit (100%).
        const fullExitTx = await fund.exit(100);
        const fullExitResult = await fullExitTx.wait();
        const fullExitGasUsed = fullExitResult.effectiveGasPrice.mul(fullExitResult.cumulativeGasUsed);
        const fullExitEvent = fullExitResult.events?.find(evt => evt.event === "Exit")

        expect(fullExitEvent).to.not.be.undefined;

        const fullExitToReturn = fullExitEvent?.args?.["toReturn"];
        const fundMembersAfterFullExit = await fund.getMembers();

        expect(fundMembersAfterFullExit).to.have.lengthOf(0);

        const fundBalanceAfterFullExit = await ethers.provider.getBalance(fund.address);

        expect(fundBalanceAfterFullExit.toNumber()).to.be.equal(0);

        const signerBalanceAfterFullExit = await ethers.provider.getBalance(signer.address);
        const fullExitCalcResult = signerBalanceAfterPartialExit.sub(fullExitGasUsed).add(fullExitToReturn);

        expect(signerBalanceAfterFullExit.eq(fullExitCalcResult)).to.be.true;
    });

    it("should be able to invite a new member", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy();
        const [founder, member1] = await ethers.getSigners();

        const memberProposalId = await submitProposal(fund, founder.address, {
            proposalType: ProposalType.AddMember,
            amount: 0,
            addresses: [member1.address]
        });

        await voteForProposal(fund, founder.address, memberProposalId);
        await executeProposal(fund, founder.address, memberProposalId);

        // member1 should now be a member.

        const members = await fund.getMembers();

        expect(members).to.have.lengthOf(2);

        const member1Record = members.find(elem => elem.addr === member1.address);

        expect(member1Record).to.not.be.null;

        // member1 should now be able to deposit funds.

        const depositProposalId = await submitProposal(
            fund,
            member1.address,
            {
                proposalType: ProposalType.DepositFunds,
                amount: 1000,
                addresses: []
            }
        );
        await voteForProposal(fund, member1.address, depositProposalId);
        await expect(
            fund.connect(await ethers.getSigner(member1.address)).executeProposal(
                depositProposalId,
                {
                    value: 1000
                }
            )
        ).to.be.revertedWith("Voting is in progress");
        await voteForProposal(fund, founder.address, depositProposalId);
        await fund.connect(await ethers.getSigner(member1.address)).executeProposal(
            depositProposalId,
            {
                value: 1000
            }
        );
        const endingMemberBalance = (await fund.getMember(member1.address)).balance;
        expect(endingMemberBalance.toNumber()).to.be.equal(1000);

        await expect(
            fund.submitProposal(
                {
                    proposalType: ProposalType.AddMember,
                    amount: 0,
                    addresses: [member1.address]
                }
            )
        ).to.be.revertedWith("Member already exists");
    });

    it("should be able to kick a member");

    it("should be able to add asset and make a swap", async () => {
        const assetTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
        const assetTokenContract = new ethers.Contract(assetTokenAddress, ERC20.abi, ethers.provider);
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const MutualFundAsset = await ethers.getContractFactory("MutualFundAsset");
        const asset = await MutualFundAsset.deploy(assetTokenAddress);
        const fund = await MutualFund.deploy();

        const initialAssetBalance = await assetTokenContract.balanceOf(asset.address);

        expect(initialAssetBalance.toNumber()).to.be.equal(0);

        const assets = await fund.getAssets();

        expect(assets).to.have.lengthOf(0);

        const [signer] = await ethers.getSigners();

        const assetProposalId = await submitProposal(
            fund,
            signer.address,
            {
                proposalType: ProposalType.AddAsset,
                amount: 0,
                addresses: [asset.address]
            }
        );
        await voteForProposal(fund, signer.address, assetProposalId);

        await executeProposal(
            fund,
            signer.address,
            assetProposalId
        );

        const newAssets = await fund.getAssets();

        expect(newAssets).to.have.lengthOf(1);
        expect(newAssets[0]).to.be.equal(asset.address);

        await depositFunds(fund, signer.address, ethers.utils.parseEther("1"));

        const signerBalanceAfterDeposit = await ethers.provider.getBalance(signer.address);

        // Propose a swap that exceeds the balance, should be reverted.
        await expect(
            fund.submitProposal(
                {
                    proposalType: ProposalType.Swap,
                    amount: ethers.utils.parseEther("2"),
                    addresses: [fund.address, asset.address]
                },
                { from: signer.address }
            )
        ).to.be.revertedWith("Invalid proposal request: amount exceeds balance");

        const swapProposalId = await submitProposal(
            fund,
            signer.address,
            {
                proposalType: ProposalType.Swap,
                amount: ethers.utils.parseEther("0.6"),
                addresses: [fund.address, asset.address]
            }
        );
        await voteForProposal(fund, signer.address, swapProposalId);
        await executeProposal(
            fund,
            signer.address,
            swapProposalId
        );

        const fundBalanceAfterSwap = await ethers.provider.getBalance(fund.address);

        expect(fundBalanceAfterSwap.eq(ethers.utils.parseEther("0.4"))).to.be.true;

        const assetBalanceAfterSwap = await asset.getTotalBalance();

        expect(assetBalanceAfterSwap.gt(0)).to.be.true;

        // Withdraw 50% of the funds.
        const partialExitTx = await fund.exit(50);
        const partialExitResult = await partialExitTx.wait();
        const partialExitGasUsed = partialExitResult.effectiveGasPrice.mul(partialExitResult.cumulativeGasUsed);
        const partialExitEvent = partialExitResult.events?.find(evt => evt.event === "Exit")

        expect(partialExitEvent).to.not.be.undefined;

        const fundBalanceAfterPartialExit = await ethers.provider.getBalance(fund.address);

        expect(fundBalanceAfterPartialExit.eq(ethers.utils.parseEther("0.2"))).to.be.true;

        const assetBalanceAfterPartialExit = await asset.getTotalBalance();

        expect(assetBalanceAfterPartialExit.toNumber()).to.be.approximately(assetBalanceAfterSwap.div(2).toNumber(), 1);

        const signerBalanceAfterPartialExit = await ethers.provider.getBalance(signer.address);

        expect(signerBalanceAfterPartialExit.gt(signerBalanceAfterDeposit.sub(partialExitGasUsed))).to.be.true;
    });

    it("should exit proportionally having multiple assets");

    it("should take the size of the shares into account during voting");
});

async function depositFunds(fund: MutualFund, from: string, amount: BigNumberish) {
    const proposalId = await submitProposal(
        fund,
        from,
        {
            proposalType: ProposalType.DepositFunds,
            amount,
            addresses: []
        }
    );

    await voteForProposal(
        fund,
        from,
        proposalId
    );

    await executeProposal(
        fund,
        from,
        proposalId,
        amount
    );
}

async function submitProposal(fund: MutualFund, from: string, proposal: MutualFund.ProposalRequestStruct): Promise<BigNumber> {
    const submitProposalTx = await fund.connect(await ethers.getSigner(from)).submitProposal(
        proposal
    );
    const submitProposalResult = await submitProposalTx.wait();

    const newProposalEvent = submitProposalResult.events?.find(evt => evt.event === "NewProposal")

    expect(newProposalEvent).to.not.be.undefined;

    const proposalId = newProposalEvent?.args?.["id"]

    expect(proposalId).to.not.be.undefined;

    return proposalId;
}

async function voteForProposal(fund: MutualFund, from: string, proposalId: BigNumberish) {
    const voteResultPromise = fund.connect(await ethers.getSigner(from)).vote(
        proposalId,
        true
    );

    await expect(voteResultPromise)
        .to.emit(fund, "NewVote")
        .withArgs(proposalId, from, true);
}

async function executeProposal(fund: MutualFund, from: string, proposalId: BigNumberish, value?: BigNumberish) {
    const executeResultPromise = fund.connect(await ethers.getSigner(from)).executeProposal(
        proposalId,
        { value }
    );

    await expect(executeResultPromise)
        .to.emit(fund, "ProposalExecuted")
        .withArgs(proposalId);
}
