import { AbstractConnector } from "@web3-react/abstract-connector";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import {
  NoEthereumProviderError,
  UserRejectedRequestError
} from "@web3-react/injected-connector";
import { MouseEvent, ReactElement, useState } from "react";
import { injected } from "../utils/connectors";
import { useEagerConnect, useInactiveListener } from "../utils/hooks";
import { Provider } from "../utils/provider";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

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

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has
  // granted access already
  const eagerConnectionSuccessful = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider,
  // if it exists
  useInactiveListener(!eagerConnectionSuccessful);

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
      disabled={!active}
      onClick={handleDeactivate}
    >
      Disconnect
    </Button>
  );
}

export function ActivateDeactivate(): ReactElement {
  const context = useWeb3React<Provider>();
  const { error } = context;

  if (!!error) {
    window.alert(getErrorMessage(error));
  }

  return (
    <Stack direction="row" justifyContent="flex-end">
      <Activate />
      <Deactivate />
    </Stack>
  );
}
