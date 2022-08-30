import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/QTOAqFmCHbDhlTt8h32fd6i1ymmRs84e",
        blockNumber: 14390000
      }
    }
  }
};

export default config;
