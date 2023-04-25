import { ReactElement } from "react";
import Grid from "@mui/material/Grid";
import { BigNumber, ethers } from "ethers";
import { MemberModel } from "../models/MemberModel";
import { BlockchainAddress } from "./BlockchainAddress";

interface AccountInfoProps {
  fundContractVersion: string;
  totalEthBalance: BigNumber;
  totalBalance: BigNumber;
  member: MemberModel;
}

export function AccountInfo(props: AccountInfoProps): ReactElement {
  const fundAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "";

  return (
    <Grid container>
      <Grid item xs={6}>
        Fund address:
      </Grid>
      <Grid item xs={6}>
        <BlockchainAddress address={fundAddress} />
      </Grid>
      <Grid item xs={6}>
        Fund contract version:
      </Grid>
      <Grid item xs={6}>
        {props.fundContractVersion}
      </Grid>
      <Grid item xs={6}>
        Total balance:
      </Grid>
      <Grid item xs={6}>
        {ethers.utils.formatEther(props.totalEthBalance)} ETH
      </Grid>
      <Grid item xs={6}>
        Your balance:
      </Grid>
      <Grid item xs={6}>
        {ethers.utils.formatEther(props.member.balance)} ETH
        ({props.totalBalance.gt(0) ? props.member.balance.mul(100).div(props.totalBalance).toNumber() : 0}%)
      </Grid>
    </Grid>
  );
}
