import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loader from "../components/Loader";
import ScrollToTop from "../components/ScrollToTop";

// Import domain-scoped routes
import { publicRoutes } from "./publicRoutes";
import { studentRoutes } from "./studentRoutes";
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
        {studentRoutes}
        {educatorRoutes}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;