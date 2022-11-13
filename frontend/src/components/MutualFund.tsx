import { useWeb3React } from '@web3-react/core';
import { Contract, ethers, Signer } from 'ethers';
import {
  ChangeEvent,
  MouseEvent,
  ReactElement,
  useEffect,
  useState
} from 'react';
import styled from 'styled-components';
import MutualFundArtifact from "../../../artifacts/contracts/MutualFund.sol/MutualFund.json"
import { Provider } from '../utils/provider';

const StyledLabel = styled.label`
  font-weight: bold;
`;

const StyledInput = styled.input`
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
`;

const StyledButton = styled.button`
  width: 150px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function MutualFund(): ReactElement {
  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [contractAddress, setContractAddress] = useState<string>("");
  const [contractAddressInput, setContractAddressInput] = useState<string>("");
  const [contract, setContract] = useState<Contract>();
  const [totalBalance, setTotalBalance] = useState<number>(0);

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  async function handleContractAddressSubmit(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    const MutualFundContract = new ethers.ContractFactory(
      MutualFundArtifact.abi,
      MutualFundArtifact.bytecode,
      signer
    );

    try {
      const mutualFundContract = await MutualFundContract.attach(contractAddressInput);

      const totalBalance = await mutualFundContract.getTotalBalance();

      setContract(mutualFundContract);
      setContractAddress(contractAddressInput);
      setTotalBalance(totalBalance);
    } catch (error: any) {
      window.alert(
        'Error!' + (error && error.message ? `\n\n${error.message}` : '')
      );
    }
  }

  function handleContractAddressInputChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setContractAddressInput(event.target.value);
  }

  return (
    <>
      <div></div>
      <StyledLabel htmlFor="contractAddressInput">Contract address</StyledLabel>
      <StyledInput
        id="contractAddressInput"
        type="text"
        onChange={handleContractAddressInputChange}
      ></StyledInput>
      <StyledButton
        disabled={!active || !contract}
        style={{
          cursor: !active || !contract ? 'not-allowed' : 'pointer',
          borderColor: !active || !contract ? 'unset' : 'blue'
        }}
        onClick={handleContractAddressSubmit}
      >
        Apply
      </StyledButton>
      <div></div>
      <StyledLabel>Total balance:</StyledLabel>
      <StyledLabel>{totalBalance}</StyledLabel>
    </>
  );
}
