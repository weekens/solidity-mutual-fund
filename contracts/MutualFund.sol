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

    string private constant version = "0.0.1";

    using ABDKMath64x64 for int128;

    struct Configuration {
        string founderName;
        uint64 votingPeriod;
        uint64 gracePeriod;
        uint64 proposalExpiryPeriod;
    }

    struct Member {
        string name;
        address addr;
        uint balance;
    }

    enum ProposalType {
        DepositFunds,
        AddAsset,
        Swap,
        AddMember,
        KickMember,
        ChangeVotingPeriod,
        ChangeGracePeriod,
        ChangeProposalExpiryPeriod
    }

    struct ProposalRequest {
        ProposalType proposalType;
        string name;
        uint amount;
        address[] addresses;
    }

    struct Vote {
        address memberAddress;
        bool support;
    }

    struct Proposal {
        uint id;
        uint createdAt;
        address author;
        ProposalRequest request;
        Vote[] votes;
    }

    event NewProposal(uint id, address author);

    event ProposalExecuted(uint id);

    event NewVote(uint proposalId, address memberAddress, bool support);

    event Exit(address memberAddress, uint8 percentage, uint toReturn);

    Configuration private configuration;
    Member[] private members;
    uint private totalBalance = 0; // Total number of share tokens minted.
    uint private proposalIdCounter = 1;
    Proposal[] private proposals;
    IAsset[] private assets;
    IUniswapV2Router01 private constant uniswapRouter =
        IUniswapV2Router01(0xf164fC0Ec4E93095b804a4795bBe1e041497b92a);
    IUniswapV2Router02 private constant uniswapRouter2 =
        IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    constructor(Configuration memory config) {
        configuration = config;
        members.push(Member({ name: config.founderName, addr: msg.sender, balance: 0 }));
    }

    modifier membersOnly() {
        require(hasMemberWithAddress(msg.sender), "Sender should be a member!");
        _;
    }

    receive() external payable {
        // Only asset contracts can deposit funds to this contract by plain transfer.
        findAssetByAddress(msg.sender);
    }

    function getVersion() public pure returns (string memory) {
        return version;
    }

    function getConfiguration() public view returns (Configuration memory) {
        return configuration;
    }

    function getMembers() public view returns (Member[] memory) {
        return members;
    }

    function getMember(address memberAddress) public view returns (Member memory) {
        (Member memory member,) = findMemberByAddress(memberAddress);
        return member;
    }

    function getTotalBalance() public view returns (uint) {
        return totalBalance;
    }

    function getAssets() public view returns (IAsset[] memory) {
        return assets;
    }

    function submitProposal(ProposalRequest memory proposalRequest) membersOnly public returns (uint) {
        validateProposalRequest(proposalRequest);

        Proposal storage newProposal = proposals.push(); // Allocate a new proposal.
        uint newProposalId = proposalIdCounter++;
        newProposal.id = newProposalId;
        newProposal.createdAt = block.timestamp;
        newProposal.author = msg.sender;
        newProposal.request = proposalRequest;
        newProposal.votes.push(Vote({ memberAddress: msg.sender, support: true }));

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
        checkCanExecuteProposal(proposal);
        ProposalType proposalType = proposal.request.proposalType;

        if (proposalType == ProposalType.DepositFunds) {
            require(proposal.request.amount == msg.value, "The sent funds amount differs from proposed");
            (Member storage member,) = findMemberByAddress(proposal.author);
            member.balance += msg.value;
            totalBalance += msg.value;
        }
        else if (proposalType == ProposalType.AddAsset) {
            IAsset asset = IAsset(proposal.request.addresses[0]);

            // Check that this is a valid asset address.
            asset.getTokenAddress();

            assets.push(asset);
        }
        else if (proposalType == ProposalType.Swap) {
            executeSwapProposal(proposal.request);
        }
        else if (proposalType == ProposalType.AddMember) {
            executeAddMemberProposal(proposal.request);
        }
        else if (proposalType == ProposalType.KickMember) {
            executeKickMemberProposal(proposal.request);
        }
        else if (proposalType == ProposalType.ChangeVotingPeriod) {
            configuration.votingPeriod = uint64(proposal.request.amount);
        }
        else if (proposalType == ProposalType.ChangeGracePeriod) {
            configuration.gracePeriod = uint64(proposal.request.amount);
        }
        else if (proposalType == ProposalType.ChangeProposalExpiryPeriod) {
            configuration.proposalExpiryPeriod = uint64(proposal.request.amount);
        }
        else {
            revert("Unknown proposal type");
        }

        removeProposalById(proposalId);

        emit ProposalExecuted(proposalId);
    }

    function dropExpiredProposals() membersOnly public {
        uint i = 0;

        while (i < proposals.length) {
            if (isProposalExpired(proposals[i])) {
                removeProposalByIndex(i);
            }
            else {
                i++;
            }
        }
    }

    function executeSwapProposal(ProposalRequest storage request) private {
        address addr1 = request.addresses[0];
        address addr2 = request.addresses[1];

        if (addr1 == address(this)) {
            IAsset asset = findAssetByAddress(addr2);
            asset.depositEth{ value: request.amount }();
        }
        else if (addr2 == address(this)) {
            IAsset asset = findAssetByAddress(addr1);
            asset.withdrawEth(request.amount, payable(address(this)));
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

            members.push(Member({ name: request.name, addr: addr, balance: 0 }));
        }
    }

    function executeKickMemberProposal(ProposalRequest storage request) private {
        uint addressesLength = request.addresses.length;

        for (uint i = 0; i < addressesLength; i++) {
            exitInternal(request.addresses[i], 100);
        }
    }

    function exit(uint8 percent) membersOnly public {
        require(percent > 0 && percent <= 100, "Invalid percentage value");

        exitInternal(msg.sender, percent);
    }

    function exitInternal(address memberAddress, uint8 percent) private {
        (Member storage member, uint memberIndex) = findMemberByAddress(memberAddress);
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
            // Swap the given burn fraction from each asset to ETH and send to member's address.
            for (uint i = 0; i < assets.length; i++) {
                uint assetTotalBalance = assets[i].getTotalBalance();

                if (assetTotalBalance > 0) {
                    uint toReturnFromAsset = ABDKMath64x64.divu(balanceToBurn, totalBalance).mulu(assetTotalBalance);
                    assets[i].withdrawEth(toReturnFromAsset, payable(memberAddress));
                }
            }

            // How much ETH to return from the contract's main treasury.
            toReturn = ABDKMath64x64.divu(balanceToBurn, totalBalance).mulu(address(this).balance);

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
            removeMemberByIndex(memberIndex);
        }

        emit Exit(memberAddress, percent, toReturn);
    }

    function validateProposalRequest(ProposalRequest memory request) private view {
        ProposalType proposalType = request.proposalType;

        if (proposalType == ProposalType.DepositFunds) {
            require(request.amount > 0, "Invalid proposal request: amount should be positive");
        }
        else if (proposalType == ProposalType.AddAsset) {
            require(request.addresses.length == 1, "Invalid proposal request: number of addresses should be 1");
            require(request.addresses[0] != address(0), "Invalid proposal request: first address should be non-zero");
        }
        else if (proposalType == ProposalType.Swap) {
            require(request.amount > 0, "Invalid proposal request: amount should be positive");
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
        else if (proposalType == ProposalType.AddMember) {
            for (uint i = 0; i < request.addresses.length; i++) {
                address addr = request.addresses[i];

                require(!hasMemberWithAddress(addr), "Member already exists");
            }
        }
        else if (proposalType == ProposalType.KickMember) {
            for (uint i = 0; i < request.addresses.length; i++) {
                address addr = request.addresses[i];

                require(hasMemberWithAddress(addr), "Member does not exist");
            }
        }
        else if (
            proposalType == ProposalType.ChangeVotingPeriod ||
            proposalType == ProposalType.ChangeGracePeriod ||
            proposalType == ProposalType.ChangeProposalExpiryPeriod
        ) {
            require(block.timestamp + request.amount >= block.timestamp, "Time period too big");
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

    function tryFindMemberWithAddress(address addr) private view returns (bool found, uint index) {
        for (uint i = 0; i < members.length; i++) {
            if (members[i].addr == addr) {
                return (true, i);
            }
        }

        return (false, 0);
    }

    function removeMemberByIndex(uint index) private {
        members[index] = members[members.length - 1];
        members.pop();
    }

    function findProposalById(uint proposalId) private view returns (Proposal storage, uint index) {
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].id == proposalId) return (proposals[i], i);
        }

        revert("Proposal not found");
    }

    function removeProposalById(uint proposalId) private {
        (, uint index) = findProposalById(proposalId);

        removeProposalByIndex(index);
    }

    function removeProposalByIndex(uint index) private {
        proposals[index] = proposals[proposals.length - 1];
        proposals.pop();
    }

    function findAssetByAddress(address addr) private view returns (IAsset) {
        for (uint i = 0; i < assets.length; i++) {
            if (address(assets[i]) == addr) return assets[i];
        }

        revert("Asset not found");
    }

    function checkCanExecuteProposal(Proposal storage proposal) private view {
        (bool result, string memory message) = canExecuteProposal(proposal);

        require(result, message);
    }

    function canExecuteProposal(Proposal storage proposal) private view returns (bool, string memory) {
        address memberAddress = msg.sender;

        if (proposal.author != memberAddress)
            return (false, "Executor is not a proposal author");

        if (isProposalExpired(proposal))
            return (false, "Proposal has expired");

        uint supportBalance = 0;
        uint noSupportBalance = 0;
        uint votesLength = proposal.votes.length;
        uint membersLength = members.length;
        uint votesDecrement = 0;

        for (uint i = 0; i < votesLength; i++) {
            Vote storage v = proposal.votes[i];
            (bool memberFound, uint memberIndex) = tryFindMemberWithAddress(v.memberAddress);

            if (memberFound) {
                Member storage member = members[memberIndex];

                if (v.support) {
                    supportBalance += member.balance;
                }
                else {
                    noSupportBalance += member.balance;
                }
            }
            else {
                votesDecrement += 1; // We don't count a vote from removed member.
            }
        }

        votesLength -= votesDecrement;

        if (membersLength == 1) {
            // Allow zero votes or vote ties when we have only one member.
            // This is to save on gas when we need to do initial housekeeping.
            if (supportBalance < noSupportBalance)
                return (false, "Proposal was rejected by voting");
        }
        else {
            if (votesLength == membersLength) {
                if (noSupportBalance > 0) {
                    if (block.timestamp <= proposal.createdAt + configuration.votingPeriod + configuration.gracePeriod)
                        return (false, "Grace period is in progress");
                }
            }
            else {
                if (block.timestamp <= proposal.createdAt + configuration.votingPeriod + configuration.gracePeriod)
                    return (false, "Voting or grace period is in progress");
            }

            if (supportBalance <= noSupportBalance)
                return (false, "Proposal was rejected by voting");
        }

        return (true, "");
    }

    function isProposalExpired(Proposal storage proposal) private view returns (bool) {
        return proposal.createdAt + configuration.proposalExpiryPeriod <= block.timestamp;
    }

    function canExecuteProposal(uint proposalId) public view returns (bool, string memory) {
        (Proposal storage proposal,) = findProposalById(proposalId);

        return canExecuteProposal(proposal);
    }

    function checkMemberCanVote(address memberAddress, Proposal storage proposal) private view {
        require(block.timestamp - proposal.createdAt < configuration.votingPeriod, "Voting period has passed");

        for (uint i = 0; i < proposal.votes.length; i++) {
            require(proposal.votes[i].memberAddress != memberAddress, "Member already voted");
        }
    }
}
