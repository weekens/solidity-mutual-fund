export enum ProposalType {
  DepositFunds,
  AddAsset,
  Swap,
  AddMember,
  KickMember,
  ChangeVotingPeriod,
  ChangeGracePeriod
}

export function toProposalType(t: number): ProposalType {
  switch (t) {
    case 0:
      return ProposalType.DepositFunds;
    case 1:
      return ProposalType.AddAsset;
    case 2:
      return ProposalType.Swap;
    case 3:
      return ProposalType.AddMember;
    case 4:
      return ProposalType.KickMember;
    case 5:
      return ProposalType.ChangeVotingPeriod;
    case 6:
      return ProposalType.ChangeGracePeriod;
    default:
      throw new Error("Unknown proposal type");
  }
}
