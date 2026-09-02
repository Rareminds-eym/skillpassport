import { Routes } from "react-router-dom";
import { recruiterOnboardingRoute, recruiterRoutes, recruiterSubscriptionPlanRoute } from "./recruiterRoutes";

const RecruiterRoutesGroup = () => (
  <Routes>
    {recruiterSubscriptionPlanRoute}
    {recruiterOnboardingRoute}
    {recruiterRoutes}
  </Routes>
);

export default RecruiterRoutesGroup;
