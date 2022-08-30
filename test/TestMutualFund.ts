import { expect } from "chai";
import { ethers } from "hardhat";
import { MutualFund } from '../typechain-types';
import { BigNumber, BigNumberish } from 'ethers';

enum ProposalType {
    DepositFunds,
    AddAsset,
    Swap
}

describe("MutualFund", function () {

    it('should add sender to members upon creation', async () => {
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const fund = await MutualFund.deploy();

        const members = await fund.getMembers();

        expect(members).to.have.lengthOf(1);

        const [signer] = await ethers.getSigners();

        const member = members.find(elem => elem.addr === signer.address);

        expect(member).to.not.be.null;
    });

    it('should be able to deposit funds with proposal', async () => {
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

    it('should be able to exit with funds');

    it('should be able to invite a new member');

    it('should be able to add asset and make a swap', async () => {
        const assetTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
        const MutualFund = await ethers.getContractFactory("MutualFund");
        const MutualFundAsset = await ethers.getContractFactory("MutualFundAsset");
        const asset = await MutualFundAsset.deploy(assetTokenAddress);
        const fund = await MutualFund.deploy();

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

        const swapProposalId = await submitProposal(
            fund,
            signer.address,
            {
                proposalType: ProposalType.Swap,
                amount: ethers.utils.parseEther("1"),
                addresses: [fund.address, asset.address, assetTokenAddress]
            }
        );
        await voteForProposal(fund, signer.address, swapProposalId);
        await executeProposal(
            fund,
            signer.address,
            swapProposalId
        );
    });
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
    const submitProposalTx = await fund.submitProposal(
        proposal,
        { from }
    );
    const submitProposalResult = await submitProposalTx.wait();

    const newProposalEvent = submitProposalResult.events?.find(evt => evt.event === "NewProposal")

    expect(newProposalEvent).to.not.be.undefined;

    const proposalId = newProposalEvent?.args?.["id"]

    expect(proposalId).to.not.be.undefined;

    return proposalId;
}

async function voteForProposal(fund: MutualFund, from: string, proposalId: BigNumberish) {
    const voteResultPromise = fund.vote(
        proposalId,
        true,
        { from }
    );

    await expect(voteResultPromise)
        .to.emit(fund, "NewVote")
        .withArgs(proposalId, from, true);
}

async function executeProposal(fund: MutualFund, from: string, proposalId: BigNumberish, value?: BigNumberish) {
    const executeResultPromise = fund.executeProposal(
        proposalId,
        { from, value }
    );

    await expect(executeResultPromise)
        .to.emit(fund, "ProposalExecuted")
        .withArgs(proposalId);
}
