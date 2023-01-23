import { BigNumber } from "ethers";

export interface ConfigurationModel {
  founderName: string;
  votingPeriod: BigNumber;
  gracePeriod: BigNumber;
  proposalExpiryPeriod: BigNumber;
}
