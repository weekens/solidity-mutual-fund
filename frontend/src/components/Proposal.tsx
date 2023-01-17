import { ProposalModel } from "../models/ProposalModel";
import { ReactElement, SyntheticEvent, useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import {
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Paper, TableCell, TableHead, TableRow, TableBody, Table, Chip, tableCellClasses, Button, Stack, Snackbar, Alert
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import BoltIcon from '@mui/icons-material/Bolt';
import { BlockTimestamp } from "./BlockTimestamp";
import { MutualFundContract } from "../MutualFundContract";
import { ethers } from "ethers";
import { BlockchainAddress } from "./BlockchainAddress";
import { proposalTypeToString } from "../models/ProposalType";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  }
}));

export interface ProposalProps {
  model: ProposalModel;
  contract: MutualFundContract;
}

export function Proposal(props: ProposalProps): ReactElement {
  const yesVotes = props.model.votes.filter(v => v.support);
  const noVotes = props.model.votes.filter(v => !v.support);

  const [canExecute, setCanExecute] = useState<boolean>(false);
  const [canNotExecuteReason, setCanNotExecuteReason] = useState<string>("");
  const [executeSnackbarOpen, setExecuteSnackbarOpen] = useState<boolean>(false);
  const [executeSuccessSnackbarOpen, setExecuteSuccessSnackbarOpen] = useState<boolean>(false);

  useEffect(() => {
    props
      .contract
      .canExecuteProposal(props.model.id)
      .then(response => {
        setCanExecute(response[0]);
        setCanNotExecuteReason(response[1]);
      })
      .catch(console.error)
  })

  async function handleExecuteProposalClick() {
    if (!canExecute) {
      console.warn("Cannot execute proposal:", canNotExecuteReason);
      return;
    }

    console.info("Executing proposal:", props.model.id);

    const proposalTxn = await props.contract.executeProposal(props.model.id, {
      value: props.model.request.amount
    });

    setExecuteSnackbarOpen(true);

    await proposalTxn.wait();

    setExecuteSnackbarOpen(false);
    setExecuteSuccessSnackbarOpen(true);
  }

  function handleExecuteSnackbarClose(event: SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setExecuteSnackbarOpen(false);
  }

  function handleExecuteSuccessSnackbarClose(event: SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') {
      return;
    }

    setExecuteSuccessSnackbarOpen(false);
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
              <Chip size="small" label={"Total: " + props.model.votes.length} sx={{ marginLeft: "15px" }}/>
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
          {
            canExecute
            ?
            <Grid container justifyContent="flex-end">
              <Grid item xs={3}>
                <Button variant="contained" fullWidth={true} onClick={handleExecuteProposalClick}>
                  <BoltIcon sx={{ color: "#f5f500" }} /> Execute proposal
                </Button>
              </Grid>
            </Grid>
            :
            (<></>)
          }
        </Stack>
      </CardContent>
      <Snackbar
        open={executeSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleExecuteSnackbarClose}
        message="Proposal execution has been triggered. Hang on while the proposal gets executed by the network."
      />
      <Snackbar open={executeSuccessSnackbarOpen} autoHideDuration={6000} onClose={handleExecuteSuccessSnackbarClose}>
        <Alert onClose={handleExecuteSuccessSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Proposal has been successfully executed!
        </Alert>
      </Snackbar>
    </Card>
  );
}
