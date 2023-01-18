import { ReactElement } from "react";
import { Stack } from "@mui/material";
import { Asset } from "./Asset";

export interface AssetListProps {
  assetAddresses: string[];
}

export function AssetList(props: AssetListProps): ReactElement {
  return (
    <Stack>
      {
        props.assetAddresses.map(assetAddress => {
          return <Asset address={assetAddress} />;
        })
      }
    </Stack>
  );
}
