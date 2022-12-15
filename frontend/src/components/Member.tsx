import { MemberModel } from "../models/MemberModel";
import { ReactElement } from "react";
import Grid from "@mui/material/Grid";
import { BigNumber, ethers } from "ethers";
import { BlockchainAddress } from "./BlockchainAddress";
import { Card, CardContent } from "@mui/material";

export interface MemberProps {
  model: MemberModel;
  totalBalance: BigNumber;
}

export function Member(props: MemberProps): ReactElement {
  return (
    <Card>
      <CardContent>
        <Grid container>
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
            {ethers.utils.formatEther(props.model.balance)} ETH (
            {props.model.balance.div(props.totalBalance).mul(100).toNumber()}%)
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
