import { ReactElement } from "react";
import Grid from "@mui/material/Grid";
import { BigNumber, ethers } from "ethers";
import { MemberModel } from "../models/MemberModel";

interface AccountInfoProps {
  totalBalance: BigNumber;
  member: MemberModel;
}

export function AccountInfo(props: AccountInfoProps): ReactElement {
  return (
    <Grid container>
      <Grid item xs={6}>
        Total balance:
      </Grid>
      <Grid item xs={6}>
        {ethers.utils.formatEther(props.totalBalance)} ETH
      </Grid>
      <Grid item xs={6}>
        Your balance:
      </Grid>
      <Grid item xs={6}>
        {ethers.utils.formatEther(props.member.balance)} ETH
        ({props.totalBalance.gt(0) ? props.member.balance.div(props.totalBalance).mul(100).toNumber() : 0}%)
      </Grid>
    </Grid>
  );
}
