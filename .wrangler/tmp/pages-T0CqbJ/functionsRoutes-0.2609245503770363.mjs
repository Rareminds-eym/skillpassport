import { onRequest as __api_adaptive_aptitude___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/adaptive-aptitude/[[path]].ts"
import { onRequest as __api_analyze_assessment___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/analyze-assessment/[[path]].ts"
import { onRequest as __api_assessment___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/assessment/[[path]].ts"
import { onRequest as __api_career___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/career/[[path]].ts"
import { onRequest as __api_course___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/course/[[path]].ts"
import { onRequest as __api_fetch_certificate___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/fetch-certificate/[[path]].ts"
import { onRequest as __api_otp___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/otp/[[path]].ts"
import { onRequest as __api_question_generation___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/question-generation/[[path]].ts"
import { onRequest as __api_role_overview___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/role-overview/[[path]].ts"
import { onRequest as __api_storage___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/storage/[[path]].ts"
import { onRequest as __api_streak___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/streak/[[path]].ts"
import { onRequest as __api_user___path___ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/api/user/[[path]].ts"
import { onRequest as ___middleware_ts_onRequest } from "/mnt/E230EB0F30EAEA0D/Rareminds/GITEX/sp-4/functions/_middleware.ts"

export const routes = [
    {
      routePath: "/api/adaptive-aptitude/:path*",
      mountPath: "/api/adaptive-aptitude",
      method: "",
      middlewares: [],
      modules: [__api_adaptive_aptitude___path___ts_onRequest],
    },
  {
      routePath: "/api/analyze-assessment/:path*",
      mountPath: "/api/analyze-assessment",
      method: "",
      middlewares: [],
      modules: [__api_analyze_assessment___path___ts_onRequest],
    },
  {
      routePath: "/api/assessment/:path*",
      mountPath: "/api/assessment",
      method: "",
      middlewares: [],
      modules: [__api_assessment___path___ts_onRequest],
    },
  {
      routePath: "/api/career/:path*",
      mountPath: "/api/career",
      method: "",
      middlewares: [],
      modules: [__api_career___path___ts_onRequest],
    },
  {
      routePath: "/api/course/:path*",
      mountPath: "/api/course",
      method: "",
      middlewares: [],
      modules: [__api_course___path___ts_onRequest],
    },
  {
      routePath: "/api/fetch-certificate/:path*",
      mountPath: "/api/fetch-certificate",
      method: "",
      middlewares: [],
      modules: [__api_fetch_certificate___path___ts_onRequest],
    },
  {
      routePath: "/api/otp/:path*",
      mountPath: "/api/otp",
      method: "",
      middlewares: [],
      modules: [__api_otp___path___ts_onRequest],
    },
  {
      routePath: "/api/question-generation/:path*",
      mountPath: "/api/question-generation",
      method: "",
      middlewares: [],
      modules: [__api_question_generation___path___ts_onRequest],
    },
  {
      routePath: "/api/role-overview/:path*",
      mountPath: "/api/role-overview",
      method: "",
      middlewares: [],
      modules: [__api_role_overview___path___ts_onRequest],
    },
  {
      routePath: "/api/storage/:path*",
      mountPath: "/api/storage",
      method: "",
      middlewares: [],
      modules: [__api_storage___path___ts_onRequest],
    },
  {
      routePath: "/api/streak/:path*",
      mountPath: "/api/streak",
      method: "",
      middlewares: [],
      modules: [__api_streak___path___ts_onRequest],
    },
  {
      routePath: "/api/user/:path*",
      mountPath: "/api/user",
      method: "",
      middlewares: [],
      modules: [__api_user___path___ts_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [],
    },
  ]