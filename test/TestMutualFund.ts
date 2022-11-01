import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { MutualFund } from "../typechain-types";
import {
    defaultFundConfig, depositFunds,
    executeProposal,
    ProposalType,
    submitProposal,
    voteAgainstProposal, voteForProposal,
} from './common';
const ERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");

describe("MutualFund", function () {

    it("should be able to deposit funds with proposal", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy(defaultFundConfig());
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
        const fund = await MutualFund.deploy(defaultFundConfig());
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
        const fund = await MutualFund.deploy(defaultFundConfig());
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

    it("should be able to add asset and make a swap", async () => {
        const assetTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
        const assetTokenContract = new ethers.Contract(assetTokenAddress, ERC20.abi, ethers.provider);
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const MutualFundAsset = await ethers.getContractFactory("MutualFundAsset");
        const asset = await MutualFundAsset.deploy(assetTokenAddress);
        const fund = await MutualFund.deploy(defaultFundConfig());

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

    it("should prohibit executing a proposal more than once");

    it("should allow partial voting", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy({
            votingPeriod: 2 * 60 * 60,
            gracePeriod: 60 * 60
        });
        const [founder, member1, member2] = await ethers.getSigners();

        await depositFunds(fund, founder.address, 10000);

        // Add new member.
        const memberProposalId = await submitProposal(fund, founder.address, {
            proposalType: ProposalType.AddMember,
            amount: 0,
            addresses: [member1.address]
        });
        await executeProposal(fund, founder.address, memberProposalId);

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
        await voteForProposal(fund, founder.address, depositProposalId);
        await fund.connect(await ethers.getSigner(member1.address)).executeProposal(
            depositProposalId,
            {
                value: 1000
            }
        );

        // Now we submit another member proposal.
        const member2ProposalId = await submitProposal(
            fund,
            member1.address,
            {
                proposalType: ProposalType.AddMember,
                amount: 0,
                addresses: [member2.address]
            }
        );

        // Try to execute proposal; should fail because the voting has not finished yet.
        await expect(
            fund.connect(await ethers.getSigner(member1.address)).executeProposal(
                member2ProposalId,
                { value: 0 }
            ))
            .to.be.revertedWith("Voting or grace period is in progress");

        // Wait for voting period to pass.
        await ethers.provider.send("evm_increaseTime", [2 * 60 * 60 + 10 * 60]);
        await ethers.provider.send("evm_mine", []);

        // Try to execute proposal; should fail because not everyone has voted, and the grace period has not passed.
        await expect(
            fund.connect(await ethers.getSigner(member1.address)).executeProposal(
                member2ProposalId,
                { value: 0 }
            ))
            .to.be.revertedWith("Voting or grace period is in progress");

        // Wait for grace period to pass.
        await ethers.provider.send("evm_increaseTime", [60 * 60]);
        await ethers.provider.send("evm_mine", []);

        // Now the proposal should be successfully executed.
        await executeProposal(fund, member1.address, member2ProposalId);
        const members = await fund.getMembers();
        expect(members).to.have.lengthOf(3);
    });

    it("should prohibit executing an expired proposal");

    it("should allow a grace period if there were negative votes");

    it("should prohibit voting after voting period");

    it("should allow changing voting period and grace period", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy(defaultFundConfig());
        const [founder, member1, member2] = await ethers.getSigners();

        await depositFunds(fund, founder.address, 10000);

        // Change the grace period.
        const gracePeriodProposalId = await submitProposal(fund, founder.address, {
            proposalType: ProposalType.ChangeGracePeriod,
            amount: 0,
            addresses: []
        });
        await executeProposal(fund, founder.address, gracePeriodProposalId);

        // Add new member.
        const memberProposalId = await submitProposal(fund, founder.address, {
            proposalType: ProposalType.AddMember,
            amount: 0,
            addresses: [member1.address]
        });
        await executeProposal(fund, founder.address, memberProposalId);

        // Deposit funds for new member.
        const depositProposalId = await submitProposal(
            fund,
            member1.address,
            {
                proposalType: ProposalType.DepositFunds,
                amount: 1000,
                addresses: []
            }
        );
        await voteForProposal(fund, founder.address, depositProposalId);
        await executeProposal(fund, member1.address, depositProposalId, 1000);

        // Submit and execute new grace period change proposal.
        // It should be successfully executed even if rejected, because the current grace period is zero.
        const gracePeriod2ProposalId = await submitProposal(fund, founder.address, {
            proposalType: ProposalType.ChangeGracePeriod,
            amount: 10 * 60,
            addresses: []
        });
        await voteAgainstProposal(fund, member1.address, gracePeriod2ProposalId);
        // Wait for voting period to pass. There should be no grace period.
        await time.increase(2 * 60 * 60 + 10);
        await executeProposal(fund, founder.address, gracePeriod2ProposalId);

        // Now try to kick a member.
        // An immediate attempt to execute proposal should fail, because the new grace period is 10 minutes.
        const kickProposalId = await submitProposal(fund, founder.address, {
            proposalType: ProposalType.KickMember,
            amount: 0,
            addresses: [member1.address]
        });
        await voteAgainstProposal(fund, member1.address, kickProposalId);
        await expect(
            fund.connect(await ethers.getSigner(founder.address)).executeProposal(kickProposalId)
        ).to.be.revertedWith("Grace period is in progress");

        // Wait for voting and grace period to pass.
        await time.increase(2 * 60 * 60 + 11 * 60);

        // The proposal should be now successfully executed.
        await executeProposal(fund, founder.address, kickProposalId);

        // Set the voting period to 0.
        const votingPeriodProposalId = await submitProposal(fund, founder.address, {
            proposalType: ProposalType.ChangeVotingPeriod,
            amount: 0,
            addresses: []
        });
        await executeProposal(fund, founder.address, votingPeriodProposalId);

        // Add new member.
        const member2ProposalId = await submitProposal(fund, founder.address, {
            proposalType: ProposalType.AddMember,
            amount: 0,
            addresses: [member2.address]
        });
        await executeProposal(fund, founder.address, member2ProposalId);

        // Deposit funds for new member.
        const deposit2ProposalId = await submitProposal(
            fund,
            member2.address,
            {
                proposalType: ProposalType.DepositFunds,
                amount: 2000,
                addresses: []
            }
        );
        await expect(
            fund.connect(await ethers.getSigner(founder.address)).vote(
                deposit2ProposalId,
                false
            )
        ).to.be.revertedWith("Voting period has passed");
    });

    it("should prohibit setting invalid voting or grace period", async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy(defaultFundConfig());
        const [founder] = await ethers.getSigners();

        await expect(
            fund.connect(await ethers.getSigner(founder.address)).submitProposal({
                proposalType: ProposalType.ChangeVotingPeriod,
                amount: ethers.constants.MaxUint256,
                addresses: []
            })
        ).to.be.revertedWithPanic(0x11);
        await expect(
            fund.connect(await ethers.getSigner(founder.address)).submitProposal({
                proposalType: ProposalType.ChangeGracePeriod,
                amount: ethers.constants.MaxUint256,
                addresses: []
            })
        ).to.be.revertedWithPanic(0x11);
    });
});
