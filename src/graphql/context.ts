import { type YogaInitialContext } from "@graphql-yoga/node";
import { prisma } from "~/utils/db";
import { initContextCache } from "@pothos/core";

import { authenticateUser } from "~/utils/auth/authenticateUser";

const yogaContext = ({ request: req }: YogaInitialContext) => {
  return {
    ...initContextCache(),
    prisma,
    user: authenticateUser(prisma, req),
    req,
  };
};

type YogaContext = ReturnType<typeof yogaContext>;

export type { YogaContext };
export { yogaContext };
