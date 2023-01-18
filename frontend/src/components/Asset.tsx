import { ReactElement } from "react";
import { Card, CardContent, Grid } from "@mui/material";
import { BlockchainAddress } from "./BlockchainAddress";

export interface AssetProps {
  address: string;
}

export function Asset(props: AssetProps): ReactElement {
  return (
    <Card>
      <CardContent>
        <Grid container>
          <Grid item xs={6}>
            Address:
          </Grid>
          <Grid item xs={6}>
            <BlockchainAddress address={props.address} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
