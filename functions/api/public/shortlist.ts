import { onRequest as shareRequest } from "../recruiter/shortlist-sharing";
import { apiError, apiMethodNotAllowed } from "../../lib/response";
/** Public bearer-link reads only. Link management remains behind recruiter authentication. */
export async function onRequest(context: any) {
  if (context.request.method !== "POST") return apiMethodNotAllowed();
  try {
    const body = await context.request.clone().json();
    if (body.action !== "read")
      return apiError(
        400,
        "INVALID_ACTION",
        "Only shared shortlist reads are supported",
        context.request,
      );
  } catch {
    return apiError(400, "VALIDATION_ERROR", "Invalid JSON", context.request);
  }
  return shareRequest(context);
}
