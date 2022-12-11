import { ReactElement } from "react";
import Grid from "@mui/material/Grid";
import { BigNumber, ethers } from "ethers";

interface AccountInfoProps {
  totalBalance: BigNumber;
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
    </Grid>
  );
}
