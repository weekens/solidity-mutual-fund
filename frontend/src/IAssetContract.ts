import { BigNumber } from "ethers";

export interface IAssetContract {
  getName(): Promise<string>;

  getTotalBalance(): Promise<BigNumber>;
}
