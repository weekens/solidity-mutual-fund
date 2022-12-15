import { MemberModel } from "../models/MemberModel";
import { ReactElement } from "react";
import Grid from "@mui/material/Grid";
import { ethers } from "ethers";
import { BlockchainAddress } from "./BlockchainAddress";
import { Card, CardContent } from "@mui/material";

export function Member(props: MemberModel): ReactElement {
  return (
    <Card>
      <CardContent>
        <Grid container>
          <Grid item xs={6}>
            Address:
          </Grid>
          <Grid item xs={6}>
            <BlockchainAddress address={props.addr}/>
          </Grid>
          <Grid item xs={6}>
            Balance:
          </Grid>
          <Grid item xs={6}>
            {ethers.utils.formatEther(props.balance)} ETH
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
