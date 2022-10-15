// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.6;
pragma experimental ABIEncoderV2;

import "./IAsset.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "abdk-libraries-solidity/ABDKMath64x64.sol";

// Mutual fund contract.
contract MutualFund {

    using ABDKMath64x64 for int128;

    struct Member {
        address addr;
        uint balance;
    }

    enum ProposalType {
        DepositFunds,
        AddAsset,
        Swap,
        AddMember
    }

    struct ProposalRequest {
        ProposalType proposalType;
        uint amount;
        address[] addresses;
    }

    struct Vote {
        address memberAddress;
        bool support;
    }

    struct Proposal {
        uint id;
        address author;
        ProposalRequest request;
        Vote[] votes;
    }

    event NewProposal(uint id, address author);

    event ProposalExecuted(uint id);

    event NewVote(uint proposalId, address memberAddress, bool support);

    event Exit(address memberAddress, uint8 percentage, uint toReturn);

    Member[] private members;
    uint private totalBalance = 0; // Total number of share tokens minted.
    uint private proposalIdCounter = 1;
    Proposal[] private proposals;
    IAsset[] private assets;
    IUniswapV2Router01 private uniswapRouter;
    IUniswapV2Router02 private uniswapRouter2;

    constructor() {
        members.push(Member({ addr: msg.sender, balance: 0 }));
        uniswapRouter = IUniswapV2Router01(0xf164fC0Ec4E93095b804a4795bBe1e041497b92a);
        uniswapRouter2 = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    }

    function getMembers() public view returns (Member[] memory) {
        return members;
    }

    function getMember(address memberAddress) public view returns (Member memory) {
        (Member memory member,) = findMemberByAddress(memberAddress);
        return member;
    }

    function getAssets() public view returns (IAsset[] memory) {
        return assets;
    }

    modifier membersOnly() {
        require(hasMemberWithAddress(msg.sender), "Sender should be a member!");
        _;
    }

    function submitProposal(ProposalRequest memory proposalRequest) membersOnly public returns (uint) {
        validateProposalRequest(proposalRequest);

        Proposal storage newProposal = proposals.push(); // Allocate a new proposal.
        uint newProposalId = proposalIdCounter++;
        newProposal.id = newProposalId;
        newProposal.author = msg.sender;
        newProposal.request = proposalRequest;

        emit NewProposal(newProposalId, msg.sender);

        return newProposalId;
    }

    function vote(uint proposalId, bool support) membersOnly public {
        (Proposal storage proposal,) = findProposalById(proposalId);
        checkMemberCanVote(msg.sender, proposal);
        proposal.votes.push(Vote({ memberAddress: msg.sender, support: support }));
        emit NewVote(proposalId, msg.sender, support);
    }

    function getProposals() membersOnly public view returns (Proposal[] memory) {
        return proposals;
    }

    function executeProposal(uint proposalId) membersOnly payable public {
        (Proposal storage proposal,) = findProposalById(proposalId);
        checkCanExecuteProposal(msg.sender, proposal);

        if (proposal.request.proposalType == ProposalType.DepositFunds) {
            require(proposal.request.amount == msg.value, "The sent funds amount differs from proposed");
            (Member storage member,) = findMemberByAddress(proposal.author);
            member.balance += msg.value;
            totalBalance = msg.value;
        }
        else if (proposal.request.proposalType == ProposalType.AddAsset) {
            IAsset asset = IAsset(proposal.request.addresses[0]);

            // Check that this is a valid asset address.
            asset.getTokenAddress();

            assets.push(asset);
        }
        else if (proposal.request.proposalType == ProposalType.Swap) {
            executeSwapProposal(proposal.request);
        }
        else if (proposal.request.proposalType == ProposalType.AddMember) {
            executeAddMemberProposal(proposal.request);
        }
        else {
            revert("Unknown proposal type");
        }

        removeProposal(proposalId);

        emit ProposalExecuted(proposalId);
    }

    function executeSwapProposal(ProposalRequest storage request) private {
        address addr1 = request.addresses[0];
        address addr2 = request.addresses[1];

        if (addr1 == address(this)) {
            IAsset asset = findAssetByAddress(addr2);
            address[] memory path = new address[](2);
            path[0] = uniswapRouter.WETH();
            path[1] = asset.getTokenAddress();
            uniswapRouter.swapExactETHForTokens{ value: request.amount }(
                0,
                path,
                addr2,
                block.timestamp + 60 * 60
            );
        }
        else if (addr2 == address(this)) {
            revert("Not implemented yet.");
        }
        else {
            revert("Not implemented yet.");
        }
    }

    function executeAddMemberProposal(ProposalRequest storage request) private {
        uint addressesLength = request.addresses.length;

        for (uint i = 0; i < addressesLength; i++) {
            address addr = request.addresses[i];

            require(!hasMemberWithAddress(addr), "Member already exists");

            members.push(Member({ addr: addr, balance: 0 }));
        }
    }

    function exit(uint8 percent) membersOnly payable public {
        require(percent > 0 && percent <= 100, "Invalid percentage value");

        (Member storage member, uint memberIndex) = findMemberByAddress(msg.sender);
        address memberAddress = member.addr;
        uint balanceToBurn = 0; // How much member voting tokens to burn.
        uint toReturn = 0;

        if (percent == 100) {
            balanceToBurn = member.balance; // Burn all member tokens. Special case to avoid precision errors.
        }
        else {
            // Burn the given percentage of member tokens (calculate it).
            balanceToBurn = ABDKMath64x64.divu(member.balance, uint256(100)).mulu(percent);
        }

        if (balanceToBurn > 0) {
            // The fraction of the burnt tokens from the total token balance.
            int128 balanceBurnFraction = ABDKMath64x64.divu(balanceToBurn, totalBalance);

            // Swap the given burn fraction from each asset to ETH and send to member's address.
            for (uint i = 0; i < assets.length; i++) {
                IAsset asset = assets[i];
                uint assetTotalBalance = asset.getTotalBalance();

                if (assetTotalBalance > 0) {
                    uint toReturnFromAsset = balanceBurnFraction.mulu(assetTotalBalance);
                    address tokenAddress = asset.getTokenAddress();
                    asset.approve(address(this), toReturnFromAsset);
                    // Move funds to this contract to be able to make a swap.
                    IERC20(tokenAddress).transferFrom(address(asset), address(this), toReturnFromAsset);
                    // Approve the Uniswap Router to spend the funds from this contract's address.
                    IERC20(tokenAddress).approve(address(uniswapRouter2), toReturnFromAsset);

                    address[] memory path = new address[](2);
                    path[0] = tokenAddress;
                    path[1] = uniswapRouter.WETH();
                    uniswapRouter2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                        toReturnFromAsset,
                        0,
                        path,
                        payable(memberAddress),
                        block.timestamp + 60 * 60
                    );
                }
            }

            // How much ETH to return from the contract's main treasury.
            toReturn = balanceBurnFraction.mulu(address(this).balance);

            if (toReturn > 0) {
                // Send ETH from the contract's main treasury to the member's address.
                payable(memberAddress).transfer(toReturn);
            }

            // Actually burn the member's voting tokens.
            member.balance -= balanceToBurn;
            totalBalance -= balanceToBurn;
        }

        // Remove the member from the fund if we've got a 100% exit.
        if (percent == 100) {
            removeMember(memberIndex);
        }

        emit Exit(memberAddress, percent, toReturn);
    }

    function validateProposalRequest(ProposalRequest memory request) private view {
        if (request.proposalType == ProposalType.DepositFunds) {
            require(request.amount > 0, "Invalid proposal request: amount should be positive");
        }
        else if (request.proposalType == ProposalType.AddAsset) {
            require(request.addresses.length == 1, "Invalid proposal request: number of addresses should be 1");
            require(request.addresses[0] != address(0), "Invalid proposal request: first address should be non-zero");
        }
        else if (request.proposalType == ProposalType.Swap) {
            require(request.amount > 0, "Invalid proposal request: amount should be positive");
            require(request.amount <= address(this).balance, "Invalid proposal request: amount exceeds balance");
            require(request.addresses.length == 2, "Invalid proposal request: number of addresses should be 2");
            require(
                request.addresses[0] != address(0) && request.addresses[1] != address(0),
                "Invalid proposal request: addresses should be non-zero"
            );
            require(
                request.addresses[0] != request.addresses[1],
                "Invalid proposal request: first and second address should not be equal"
            );
        }
        else if (request.proposalType == ProposalType.AddMember) {
            for (uint i = 0; i < request.addresses.length; i++) {
                address addr = request.addresses[i];

                require(!hasMemberWithAddress(addr), "Member already exists");
            }
        }
    }

    function hasMemberWithAddress(address addr) private view returns (bool) {
        uint membersLength = members.length;

        for (uint i = 0; i < membersLength; i++) {
            if (members[i].addr == addr) return true;
        }

        return false;
    }

    function findMemberByAddress(address addr) private view returns (Member storage, uint memberIndex) {
        for (uint i = 0; i < members.length; i++) {
            if (members[i].addr == addr) return (members[i], i);
        }

        revert("Member not found");
    }

    function removeMember(uint index) private {
        for(uint i = index; i < members.length - 1; i++) {
            members[i] = members[i + 1];
        }
        members.pop();
    }

    function findProposalById(uint proposalId) private view returns (Proposal storage, uint index) {
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].id == proposalId) return (proposals[i], i);
        }

        revert("Proposal not found");
    }

    function removeProposal(uint proposalId) private {
        (, uint index) = findProposalById(proposalId);

        for(uint i = index; i < proposals.length - 1; i++) {
            proposals[i] = proposals[i + 1];
        }
        proposals.pop();
    }

    function findAssetByAddress(address addr) private view returns (IAsset) {
        for (uint i = 0; i < assets.length; i++) {
            if (address(assets[i]) == addr) return assets[i];
        }

        revert("Asset not found");
    }

    function checkCanExecuteProposal(address memberAddress, Proposal storage proposal) private view {
        require(proposal.author == memberAddress, "Executor is not a proposal author");

        int score = 0;
        uint votesLength = proposal.votes.length;

        require(votesLength == members.length, "Voting is in progress");

        for (uint i = 0; i < votesLength; i++) {
            Vote storage v = proposal.votes[i];
            if (v.support) {
                score++;
            }
            else {
                score--;
            }
        }
        require(score >= 0, "Proposal was rejected by voting");
    }

    function checkMemberCanVote(address memberAddress, Proposal storage proposal) private view {
        for (uint i = 0; i < proposal.votes.length; i++) {
            require(proposal.votes[i].memberAddress != memberAddress, "Member already voted");
        }
    }
}
