import { MemberModel } from "../models/MemberModel";
import { ReactElement } from "react";
import Grid from "@mui/material/Grid";
import { BigNumber, ethers } from "ethers";
import { BlockchainAddress } from "./BlockchainAddress";
import { Card, CardContent } from "@mui/material";

export interface MemberProps {
  model: MemberModel;
  totalBalance: BigNumber;
  totalEthBalance: BigNumber;
}

export function Member(props: MemberProps): ReactElement {
  const memberEthBalance = props.totalBalance.gt(0) ?
    props.model.balance.mul(props.totalEthBalance).div(props.totalBalance) :
    BigNumber.from(0);
  const memberSharePercent = props.totalBalance.gt(0) ?
    props.model.balance.mul(100).div(props.totalBalance) :
    BigNumber.from(0);

  return (
    <Card>
      <CardContent>
        <Grid container>
          <Grid item xs={6}>
            Name:
          </Grid>
          <Grid item xs={6}>
            {props.model.name}
          </Grid>
          <Grid item xs={6}>
            Address:
          </Grid>
          <Grid item xs={6}>
            <BlockchainAddress address={props.model.addr}/>
          </Grid>
          <Grid item xs={6}>
            Balance:
          </Grid>
          <Grid item xs={6}>
            {ethers.utils.formatEther(memberEthBalance)} ETH (
            {memberSharePercent.toNumber()}%)
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
