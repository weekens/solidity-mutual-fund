import { ethers } from "hardhat";

async function main() {
  const MutualFundAsset = await ethers.getContractFactory("MutualFundAsset");

  const fund = await MutualFundAsset.deploy(
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    "0xDE466BC4b09C36dc9a53DA55ED0033E5cE4410f5",
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
