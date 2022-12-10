import { ProposalModel } from "../models/ProposalModel";
import { ReactElement } from "react";
import {
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Paper, TableCell, TableHead, TableRow, TableBody, Table, Chip
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import { BlockTimestamp } from "./BlockTimestamp";

export function Proposal(props: ProposalModel): ReactElement {
  const yesVotes = props.votes.filter(v => v.support);
  const noVotes = props.votes.filter(v => !v.support);

  return (
    <Card>
      <CardContent>
        <Grid container>
          <Grid item xs={6}>
            Author:
          </Grid>
          <Grid item xs={6}>
            {props.author}
          </Grid>
          <Grid item xs={6}>
            Created at:
          </Grid>
          <Grid item xs={6}>
            <BlockTimestamp data={props.createdAt} />
          </Grid>
          <Grid item xs={6}>
            Type:
          </Grid>
          <Grid item xs={6}>
            {props.request.proposalType}
          </Grid>

          <Accordion sx={{ width: "100%", marginTop: "15px" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <span>Votes</span>
              <Chip size="small" label={"Total: " + props.votes.length} sx={{ marginLeft: "15px" }}/>
              {
                (yesVotes.length > 0)
                  ?
                  <Chip size="small" label={"Yes: " + props.votes.filter(v => v.support).length} color="success"/>
                  :
                  (<></>)
              }
              {
                (noVotes.length > 0)
                  ?
                  <Chip size="small" label={"No: " + props.votes.filter(v => !v.support).length} color="error"/>
                  :
                  (<></>)
              }
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Voter</TableCell>
                      <TableCell>Supports?</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {props.votes.map(vote => (
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
      </CardContent>
    </Card>
  );
}
