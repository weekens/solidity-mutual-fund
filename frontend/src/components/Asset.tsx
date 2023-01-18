import { ReactElement, useEffect, useState } from "react";
import IAssetArtifact from "../contracts/IAsset.sol/IAsset.json"
import { Card, CardContent, Grid } from "@mui/material";
import { BlockchainAddress } from "./BlockchainAddress";
import { useWeb3React } from "@web3-react/core";
import { Provider } from "../utils/provider";
import { ethers } from "ethers";
import { IAssetContract } from "../IAssetContract";

export interface AssetProps {
  address: string;
}

export function Asset(props: AssetProps): ReactElement {
  const context = useWeb3React<Provider>();
  const { library } = context;
  const [contract, setContract] = useState<IAssetContract>();
  const [name, setName] = useState<string>();
  const [totalBalance, setTotalBalance] = useState<string>();

  useEffect(() => {
    if (!library) return;

    const signer = library.getSigner();

    if (!signer) return;

    async function loadContract() {
      const assetContractFactory = new ethers.ContractFactory(
        IAssetArtifact.abi,
        IAssetArtifact.bytecode,
        signer
      );

      const assetContract = await assetContractFactory.attach(props.address);

      setContract(assetContract as unknown as IAssetContract);
    }

    loadContract().catch(console.error);
  }, [library, props.address]);

  useEffect(() => {
    if (!contract) return;

    const loadData = async () => {
      await Promise.all([
        contract.getName().then(name => { setName(name) }),
        contract.getTotalBalance().then(totalBalance => { setTotalBalance(ethers.utils.formatEther(totalBalance)) })
      ]);
    };

    loadData().catch(console.error);
  }, [contract]);

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
          <Grid item xs={6}>
            Name:
          </Grid>
          <Grid item xs={6}>
            {name}
          </Grid>
          <Grid item xs={6}>
            Total balance:
          </Grid>
          <Grid item xs={6}>
            {totalBalance}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
