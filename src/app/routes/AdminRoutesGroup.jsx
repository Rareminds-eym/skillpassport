import { Routes } from "react-router-dom";
import { collegeAdminRoutes, schoolAdminRoutes, universityAdminRoutes } from "./adminRoutes";

const AdminRoutesGroup = () => (
  <Routes>
    {collegeAdminRoutes}
    {schoolAdminRoutes}
    {universityAdminRoutes}
  </Routes>
);

export default AdminRoutesGroup;
