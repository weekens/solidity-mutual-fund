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
  Paper, TableCell, TableHead, TableRow, TableBody, Table
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export function Proposal(props: ProposalModel): ReactElement {
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
            {props.createdAt.toString()}
          </Grid>
          <Grid item xs={6}>
            Type:
          </Grid>
          <Grid item xs={6}>
            {props.request.proposalType}
          </Grid>

          <Accordion sx={{ width: "100%", marginTop: "15px" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>Votes</AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Voter</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {props.votes.map(vote => (
                      <TableRow key={vote.memberAddress}>
                        <TableCell component="th" scope="row">
                          {vote.memberAddress}
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
