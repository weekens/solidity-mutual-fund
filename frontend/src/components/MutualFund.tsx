import { useWeb3React } from '@web3-react/core';
import { Contract, ethers, Signer } from 'ethers';
import {
  ReactElement,
  useEffect,
  useState
} from 'react';
import styled from 'styled-components';
import MutualFundArtifact from "../contracts/MutualFund.sol/MutualFund.json"
import { Provider } from '../utils/provider';

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "";

const StyledLabel = styled.label`
  font-weight: bold;
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
  const [contract, setContract] = useState<Contract>();
  const [totalBalance, setTotalBalance] = useState<string>("");
  const [members, setMembers] = useState<MemberModel[]>([]);

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    const signer = library.getSigner();

    setSigner(signer);

    const loadData = async () => {
      const MutualFundContract = new ethers.ContractFactory(
        MutualFundArtifact.abi,
        MutualFundArtifact.bytecode,
        signer
      );

      const mutualFundContract = await MutualFundContract.attach(contractAddress);

      const totalBalance = await mutualFundContract.getTotalBalance();

      setContract(mutualFundContract);
      setTotalBalance(totalBalance.toString());

      const members = await mutualFundContract.getMembers();

      console.log("members =", members);

      setMembers(members);
    };

    loadData().catch(console.error);
  }, [library]);

  return (
    <StyledDiv>
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
