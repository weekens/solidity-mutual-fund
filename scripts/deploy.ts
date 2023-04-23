import { ethers } from "hardhat";

async function main() {
  const config = {
    votingPeriod: 2 * 24 * 60 * 60,
    gracePeriod: 24 * 60 * 60,
    proposalExpiryPeriod: 5 * 24 * 60 * 60,
    founderName: "Viktor Isaev"
  };
  const MutualFund = await ethers.getContractFactory("MutualFund");
  const deployTransaction = MutualFund.getDeployTransaction(config, { gasLimit: 30000000 });
  const gasCost = await ethers.provider.estimateGas(deployTransaction);

  console.log("Estimated gas cost:", ethers.utils.formatEther(gasCost));
  console.log("Deploying fund contract...");

  const fund = await MutualFund.deploy(config, { gasLimit: 30000000 });

  console.log("Contract deployed to address:", fund.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
