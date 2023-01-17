import { ethers } from "hardhat";

async function main() {
  const MutualFund = await ethers.getContractFactory("MutualFund");

  const fund = await MutualFund.deploy({
    votingPeriod: 2 * 24 * 60 * 60,
    gracePeriod: 24 * 60 * 60,
    proposalExpiryPeriod: 5 * 24 * 60 * 60,
    founderName: "Viktor Isaev"
  });
  console.log("Contract deployed to address:", fund.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
