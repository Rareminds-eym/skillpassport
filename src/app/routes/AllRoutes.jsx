import { lazy } from "react";
import { useLocation } from "react-router-dom";

const PublicRoutesGroup = lazy(() => import("./PublicRoutesGroup"));
const AdminRoutesGroup = lazy(() => import("./AdminRoutesGroup"));
const RecruiterRoutesGroup = lazy(() => import("./RecruiterRoutesGroup"));
const LearnerRoutesGroup = lazy(() => import("./LearnerRoutesGroup"));
const EducatorRoutesGroup = lazy(() => import("./EducatorRoutesGroup"));

const publicLearnerProfilePattern = /^\/learner\/profile\/[^/]+$/;

const AllRoutes = () => {
  const { pathname } = useLocation();

  if (pathname.startsWith("/college-admin") ||
    pathname.startsWith("/school-admin") ||
    pathname.startsWith("/university-admin")) {
    return <AdminRoutesGroup />;
  }

  if (pathname.startsWith("/recruitment")) {
    return <RecruiterRoutesGroup />;
  }

  if (pathname.startsWith("/educator")) {
    return <EducatorRoutesGroup />;
  }

  if (pathname.startsWith("/learner") && !publicLearnerProfilePattern.test(pathname)) {
    return <LearnerRoutesGroup />;
  }

  return <PublicRoutesGroup />;
};

export default AllRoutes;
