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
import MutualFundArtifact from "../contracts/MutualFund.sol/MutualFund.json"
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

const StyledDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 135px 2.7fr 1fr;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
`;

interface MemberModel {
  addr: string;
  balance: number;
}

function Member(props: MemberModel): ReactElement {
  return (
    <div>
      <div>
        <StyledLabel>Address:</StyledLabel>
        <StyledLabel>{props.addr}</StyledLabel>
      </div>
      <div>
        <StyledLabel>Balance:</StyledLabel>
        <StyledLabel>{props.balance.toString()}</StyledLabel>
      </div>
    </div>
  );
}

export function MutualFund(): ReactElement {
  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [contractAddress, setContractAddress] = useState<string>("");
  const [contractAddressInput, setContractAddressInput] = useState<string>("");
  const [contract, setContract] = useState<Contract>();
  const [totalBalance, setTotalBalance] = useState<string>("");
  const [members, setMembers] = useState<MemberModel[]>([]);

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

    const mutualFundContract = await MutualFundContract.attach(contractAddressInput);

    const totalBalance = await mutualFundContract.getTotalBalance();

    setContract(mutualFundContract);
    setContractAddress(contractAddressInput);
    setTotalBalance(totalBalance.toString());

    const members = await mutualFundContract.getMembers();

    console.log("members =", members);

    setMembers(members);
  }

  function handleContractAddressInputChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setContractAddressInput(event.target.value);
  }

  return (
    <StyledDiv>
      <StyledLabel htmlFor="contractAddressInput">Contract address</StyledLabel>
      <StyledInput
        id="contractAddressInput"
        type="text"
        onChange={handleContractAddressInputChange}
      ></StyledInput>
      <StyledButton
        disabled={!active || !contractAddressInput}
        style={{
          cursor: !active || !contractAddressInput ? 'not-allowed' : 'pointer',
          borderColor: !active || !contract || !contractAddressInput ? 'unset' : 'blue'
        }}
        onClick={handleContractAddressSubmit}
      >
        Apply
      </StyledButton>
      <StyledLabel>Total balance:</StyledLabel>
      <StyledLabel>{totalBalance}</StyledLabel>
      <div></div>
      {
        members.map((member) => {
          return <Member key={member.addr} addr={member.addr} balance={member.balance}/>
        })
      }
    </StyledDiv>
  );
}
