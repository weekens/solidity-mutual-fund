import { AbstractConnector } from "@web3-react/abstract-connector";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import { NoEthereumProviderError, UserRejectedRequestError } from "@web3-react/injected-connector";
import { MouseEvent, ReactElement, useEffect, useState } from "react";
import { injected } from "../utils/connectors";
import { Provider } from "../utils/provider";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { BlockchainAddress } from "./BlockchainAddress";
import { WithdrawFunds } from "./WithdrawFunds";
import { MemberModel } from "../models/MemberModel";

type ActivateFunction = (
  connector: AbstractConnector,
  onError?: (error: Error) => void,
  throwErrors?: boolean
) => Promise<void>;

function getErrorMessage(error: Error): string {
  let errorMessage: string;

  switch (error.constructor) {
    case NoEthereumProviderError:
      errorMessage = `No Ethereum browser extension detected. Please install MetaMask extension.`;
      break;
    case UnsupportedChainIdError:
      errorMessage = `You're connected to an unsupported network.`;
      break;
    case UserRejectedRequestError:
      errorMessage = `Please authorize this website to access your Ethereum account.`;
      break;
    default:
      errorMessage = error.message;
  }

  return errorMessage;
}

function Activate(): ReactElement {
  const context = useWeb3React<Provider>();
  const { activate, active } = context;

  const [, setActivating] = useState<boolean>(false);

  function handleActivate(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();

    async function _activate(activate: ActivateFunction): Promise<void> {
      setActivating(true);
      await activate(injected);
      setActivating(false);
    }

    _activate(activate);
  }

  return (
    <Button
      variant="contained"
      disabled={active}
      onClick={handleActivate}
    >
      Connect
    </Button>
  );
}

function Deactivate(): ReactElement {
  const context = useWeb3React<Provider>();
  const { deactivate, active } = context;

  function handleDeactivate(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();

    deactivate();
  }

  return (
    <Button
      variant="outlined"
      disabled={!active}
      onClick={handleDeactivate}
    >
      Disconnect
    </Button>
  );
}

export interface TopBarProps {
  selfMember?: MemberModel;
}

export function TopBar(props: TopBarProps): ReactElement {
  const context = useWeb3React<Provider>();
  const { library, account, error, active } = context;
  const [selfAddress, setSelfAddress] = useState<string>();

  if (!!error) {
    window.alert(getErrorMessage(error));
  }

  useEffect(() => {
    library
      ?.getSigner()
      ?.getAddress()
      ?.then(address => {
        setSelfAddress(address);
      })
  }, [library, account]);

  return (
    <Stack direction="row" justifyContent="flex-end" spacing={2}>
      {
        !!selfAddress
        ?
        <BlockchainAddress address={selfAddress} />
        :
        (<></>)
      }
      {
        active && !!props.selfMember
        ?
        <WithdrawFunds selfMember={props.selfMember} />
        :
        (<></>)
      }
      <Activate />
      <Deactivate />
    </Stack>
  );
}
