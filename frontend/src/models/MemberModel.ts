import { BigNumber } from "ethers";

export interface MemberModel {
  name: string;
  addr: string;
  balance: BigNumber;
}
