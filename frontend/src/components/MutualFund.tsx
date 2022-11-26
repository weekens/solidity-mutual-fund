import { useWeb3React } from "@web3-react/core";
import { Contract, ethers, Signer } from "ethers";
import {
  ReactElement,
  useEffect,
  useState
} from "react";
import styled from "styled-components";
import MutualFundArtifact from "../contracts/MutualFund.sol/MutualFund.json"
import { Provider } from "../utils/provider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "";

const StyledLabel = styled.label`
  font-weight: bold;
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export function MutualFund(): ReactElement {
  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [contract, setContract] = useState<Contract>();
  const [tabIndex, setTabIndex] = useState<number>(0);
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="basic tabs example">
          <Tab label="Home" {...a11yProps(0)} />
          <Tab label="Item Two" {...a11yProps(1)} />
          <Tab label="Item Three" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={tabIndex} index={0}>
        <StyledLabel>Total balance:</StyledLabel>
        <StyledLabel>{totalBalance}</StyledLabel>
        <div></div>
        {
          members.map((member) => {
            return <Member key={member.addr} addr={member.addr} balance={member.balance}/>
          })
        }
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        Item Two
      </TabPanel>
      <TabPanel value={tabIndex} index={2}>
        Item Three
      </TabPanel>
    </Box>
  );
}
