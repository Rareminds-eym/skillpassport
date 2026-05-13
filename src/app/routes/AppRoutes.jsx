import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loader from "@/shared/ui/Loader";
import ScrollToTop from "@/shared/ui/ScrollToTop";

// Import domain-scoped routes
import { publicRoutes } from "./publicRoutes";
import { learnerRoutes } from "./learnerRoutes";
import { educatorRoutes } from "./educatorRoutes";
import { recruiterRoutes } from "./recruiterRoutes";
import { collegeAdminRoutes, schoolAdminRoutes, universityAdminRoutes } from "./adminRoutes";

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ScrollToTop />
      <Routes>
        {publicRoutes}
        {collegeAdminRoutes}
        {schoolAdminRoutes}
        {universityAdminRoutes}
        {recruiterRoutes}
        {learnerRoutes}
        {educatorRoutes}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
