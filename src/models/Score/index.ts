import { builder } from "../../builder";
import "./query";
import "./mutation";

builder.prismaObject("Scores", {
  fields: (t) => ({
    teamId: t.exposeID("teamId"),
    criteriaId: t.exposeID("criteriaId"),
    score: t.exposeString("score"),
    team: t.relation("Team"),
  }),
});

builder.prismaObject("Comments", {
  fields: (t) => ({
    teamId: t.exposeID("teamId"),
    eventId: t.exposeID("eventId"),
    roundNo: t.exposeInt("roundNo"),
    comment: t.exposeString("comment"),
    team: t.relation("Team"),
    round: t.relation("Round"),
  }),
});
