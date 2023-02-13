import { ProposalModel } from "../models/ProposalModel";
import { ReactElement, SyntheticEvent, useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import BoltIcon from "@mui/icons-material/Bolt";
import { BlockTimestamp } from "./BlockTimestamp";
import { MutualFundContract } from "../MutualFundContract";
import { ethers, Signer } from "ethers";
import { BlockchainAddress } from "./BlockchainAddress";
import { proposalTypeToString } from "../models/ProposalType";
import { useWeb3React } from "@web3-react/core";
import { Provider } from "../utils/provider";
import { ConfigurationModel } from "../models/ConfigurationModel";
import { MemberModel } from "../models/MemberModel";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  }
}));

export interface ProposalProps {
  model: ProposalModel;
  members: MemberModel[];
  contract: MutualFundContract;
}

export function Proposal(props: ProposalProps): ReactElement {
  const yesVotes = props.model.votes.filter(v => v.support);
  const noVotes = props.model.votes.filter(v => !v.support);
  const everyoneVoted = props.model.votes.length === props.members.length;

  const context = useWeb3React<Provider>();
  const { library, account } = context;

  const [signer, setSigner] = useState<Signer>();
  const [signerAddress, setSignerAddress] = useState<string>();
  const [configuration, setConfiguration] = useState<ConfigurationModel>();
  const [canExecute, setCanExecute] = useState<boolean>(false);
  const [canVote, setCanVote] = useState<boolean>(false);
  const [canNotExecuteReason, setCanNotExecuteReason] = useState<string>("");
  const [executeSnackbarOpen, setExecuteSnackbarOpen] = useState<boolean>(false);
  const [voteSnackbarOpen, setVoteSnackbarOpen] = useState<boolean>(false);
  const [executeSuccessSnackbarOpen, setExecuteSuccessSnackbarOpen] = useState<boolean>(false);
  const [voteSuccessSnackbarOpen, setVoteSuccessSnackbarOpen] = useState<boolean>(false);

  useEffect(() => {
    setSigner(library?.getSigner() || undefined);
  }, [library, account]);

  useEffect(() => {
    const loadSignerAddress = async () => {
      setSignerAddress(await signer?.getAddress() || undefined);
    }

    loadSignerAddress().catch(console.error);
  }, [signer]);

  useEffect(() => {
    props
      .contract
      .canExecuteProposal(props.model.id)
      .then(response => {
        setCanExecute(response[0]);
        setCanNotExecuteReason(response[1]);
      })
      .catch(console.error);

    props
      .contract
      .getConfiguration()
      .then(response => {
        setConfiguration(response);
      })
      .catch(console.error);
  }, [signerAddress, props.contract, props.model.id]);

  useEffect(() => {
    const currentTimeMillis = new Date().getTime();

    setCanVote(
      !!signerAddress &&
      !!configuration &&
      !props.model.votes.some(v => v.memberAddress === signerAddress) &&
      props
        .model
        .createdAt
        .add(configuration.votingPeriod)
        .mul(1000)
        .gt(currentTimeMillis) &&
      props
        .model
        .createdAt
        .add(configuration.proposalExpiryPeriod)
        .mul(1000)
        .gt(currentTimeMillis)
    );
  }, [signerAddress, props.model.votes, props.model.createdAt, configuration]);

  async function handleExecuteProposalClick() {
    if (!canExecute) {
      alert("Cannot execute proposal: " + canNotExecuteReason);
      return;
    }

    console.info("Executing proposal:", props.model.id);

    try {
      const proposalTxn = await props.contract.executeProposal(props.model.id, {
        value: props.model.request.amount
      });

      setExecuteSnackbarOpen(true);

      await proposalTxn.wait();

      setExecuteSnackbarOpen(false);
      setExecuteSuccessSnackbarOpen(true);
    } catch (err) {
      alert(err);
    }
  }

  async function handleVoteForProposalClick() {
    await handleVoteClick(true);
  }

  async function handleVoteAgainstProposalClick() {
    await handleVoteClick(false);
  }

  async function handleVoteClick(support: boolean) {
    try {
      const voteTxn = await props.contract.vote(props.model.id, support);

      setVoteSnackbarOpen(true);

      await voteTxn.wait();

      setVoteSnackbarOpen(false);
      setVoteSuccessSnackbarOpen(true);
    } catch (err) {
      alert(err)
    }
  }

  function handleExecuteSnackbarClose(event: SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setExecuteSnackbarOpen(false);
  }

  function handleVoteSnackbarClose(event: SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setVoteSnackbarOpen(false);
  }

  function handleExecuteSuccessSnackbarClose(event: SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setExecuteSuccessSnackbarOpen(false);
  }

  function handleVoteSuccessSnackbarClose(event: SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setVoteSuccessSnackbarOpen(false);
  }

  if (!configuration) return (<></>);

  let graceTimestampElement: ReactElement | undefined = undefined;

  if (!everyoneVoted || noVotes.length > 0) {
    graceTimestampElement = (
      <>
        <Grid item xs={6}>
          Grace period ends at:
        </Grid>
        <Grid item xs={6}>
          <BlockTimestamp data={props.model.createdAt.add(configuration.votingPeriod).add(configuration.gracePeriod)} />
        </Grid>
      </>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack gap="15px">
          <Grid container>
            <Grid item xs={6}>
              Author:
            </Grid>
            <Grid item xs={6}>
              <BlockchainAddress address={props.model.author} />
            </Grid>
            <Grid item xs={6}>
              Created at:
            </Grid>
            <Grid item xs={6}>
              <BlockTimestamp data={props.model.createdAt} />
            </Grid>
            <Grid item xs={6}>
              Expires at:
            </Grid>
            <Grid item xs={6}>
              <BlockTimestamp data={props.model.createdAt.add(configuration.proposalExpiryPeriod)} />
            </Grid>
            {
              !everyoneVoted
              ?
              (
                <>
                  <Grid item xs={6}>
                    Voting ends at:
                  </Grid>
                  <Grid item xs={6}>
                    <BlockTimestamp data={props.model.createdAt.add(configuration.votingPeriod)} />
                  </Grid>
                </>
              )
              :
              (<></>)
            }
            {
              graceTimestampElement || (<></>)
            }
            <Grid item xs={6}>
              Type:
            </Grid>
            <Grid item xs={6}>
              {proposalTypeToString(props.model.request.proposalType)}
            </Grid>
            <Grid item xs={6}>
              Name:
            </Grid>
            <Grid item xs={6}>
              {props.model.request.name}
            </Grid>
            <Grid item xs={6}>
              Amount:
            </Grid>
            <Grid item xs={6}>
              {ethers.utils.formatEther(props.model.request.amount)} ETH
            </Grid>
            <Grid item xs={6}>
              Addresses:
            </Grid>
            <Grid item xs={6}>
              {props.model.request.addresses.join(",")}
            </Grid>
          </Grid>
          <Accordion sx={{ width: "100%" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <span>Votes</span>
              <Chip
                  size="small"
                  label={"Total: " + props.model.votes.length + " of " + props.members.length}
                  sx={{ marginLeft: "15px" }}
              />
              {
                (yesVotes.length > 0)
                  ?
                  <Chip size="small" label={"Yes: " + props.model.votes.filter(v => v.support).length} color="success"/>
                  :
                  (<></>)
              }
              {
                (noVotes.length > 0)
                  ?
                  <Chip size="small" label={"No: " + props.model.votes.filter(v => !v.support).length} color="error"/>
                  :
                  (<></>)
              }
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Voter</StyledTableCell>
                      <StyledTableCell>Supports?</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {props.model.votes.map(vote => (
                      <TableRow key={vote.memberAddress}>
                        <TableCell component="th" scope="row">
                          <BlockchainAddress address={vote.memberAddress} />
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {
                            vote.support
                              ?
                              <Chip icon={<ThumbUpAltIcon/>} color="success" label="Yes"/>
                              :
                              <Chip icon={<ThumbDownAltIcon/>} color="error" label="No"/>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
          <Grid container justifyContent="flex-end" spacing={2}>
          {
            canExecute
            ?
            <Grid item xs={3}>
              <Button variant="contained" fullWidth={true} onClick={handleExecuteProposalClick}>
                <BoltIcon sx={{ color: "#f5f500" }} /> Execute proposal
              </Button>
            </Grid>
            :
            (<></>)
          }
          {
            canVote
            ?
            <Grid item xs={3}>
              <Button variant="contained" fullWidth={true} color="success" onClick={handleVoteForProposalClick}>
                <ThumbUpAltIcon /> Vote for proposal
              </Button>
            </Grid>
            :
            (<></>)
          }
          {
            canVote
            ?
            <Grid item xs={3}>
              <Button variant="contained" fullWidth={true} color="error" onClick={handleVoteAgainstProposalClick}>
                <ThumbDownAltIcon /> Vote against proposal
              </Button>
            </Grid>
            :
            (<></>)
          }
          </Grid>
        </Stack>
      </CardContent>
      <Snackbar
        open={executeSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleExecuteSnackbarClose}
        message="Proposal execution has been triggered. Hang on while the proposal gets executed by the network."
      />
      <Snackbar
        open={voteSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleVoteSnackbarClose}
        message="Proposal vote has been submitted. Hang on while the vote gets processed by the network."
      />
      <Snackbar open={executeSuccessSnackbarOpen} autoHideDuration={6000} onClose={handleExecuteSuccessSnackbarClose}>
        <Alert onClose={handleExecuteSuccessSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Proposal has been successfully executed!
        </Alert>
      </Snackbar>
      <Snackbar open={voteSuccessSnackbarOpen} autoHideDuration={6000} onClose={handleVoteSuccessSnackbarClose}>
        <Alert onClose={handleVoteSuccessSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Vote has been successfully processed!
        </Alert>
      </Snackbar>
    </Card>
  );
}
