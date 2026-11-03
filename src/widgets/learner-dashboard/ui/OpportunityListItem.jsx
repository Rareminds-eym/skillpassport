import OpportunityCard from './OpportunityCard';

/** The list shares card actions and eligibility rather than maintaining a second contract. */
export default function OpportunityListItem(props) {
  return <OpportunityCard {...props} list />;
}
