import { lazy, Suspense } from "react";
import Loader from "@/shared/ui/Loader";
import ScrollToTop from "@/shared/ui/ScrollToTop";

const AllRoutes = lazy(() => import("./AllRoutes"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ScrollToTop />
      <AllRoutes />
    </Suspense>
  );
};

export default AppRoutes;
