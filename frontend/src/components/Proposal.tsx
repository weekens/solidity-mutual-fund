import { ProposalModel } from "../models/ProposalModel";
import { ReactElement } from "react";
import { styled } from "@mui/material/styles";
import {
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Paper, TableCell, TableHead, TableRow, TableBody, Table, Chip, tableCellClasses, Button
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import { BlockTimestamp } from "./BlockTimestamp";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  }
}));

export interface ProposalProps {
  model: ProposalModel;
  canExecute: boolean;
}

export function Proposal(props: ProposalProps): ReactElement {
  const yesVotes = props.model.votes.filter(v => v.support);
  const noVotes = props.model.votes.filter(v => !v.support);

  return (
    <Card>
      <CardContent>
        <Grid container>
          <Grid item xs={6}>
            Author:
          </Grid>
          <Grid item xs={6}>
            {props.model.author}
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
            {props.model.request.proposalType}
          </Grid>

          <Accordion sx={{ width: "100%", marginTop: "15px" }}>
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
                          {vote.memberAddress}
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
        </Grid>
        {
          props.canExecute
          ?
          <Button>Execute proposal</Button>
          :
          (<></>)
        }
      </CardContent>
    </Card>
  );
}
