import { ethers } from "hardhat";

async function main() {
  const MutualFundAsset = await ethers.getContractFactory("MutualFundAsset");

  const fund = await MutualFundAsset.deploy(
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    "0x7d3c358D7032d9749483aDA96595EcC6BC722E13",
    "UNI"
  );
  console.log("Asset contract deployed to address:", fund.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
