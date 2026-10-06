import { Link, useLocation } from "react-router-dom";

export default function ManageEducatorsLink() {
  const { pathname } = useLocation();
  const to = pathname.startsWith("/college-admin/")
    ? "/college-admin/departments/educators"
    : pathname.startsWith("/school-admin/") ? "/school-admin/teachers/list" : null;

  return to ? (
    <Link to={to} className="inline-flex w-fit shrink-0 items-center rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
      Manage educators
    </Link>
  ) : null;
}
