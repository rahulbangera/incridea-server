import { builder } from "~/graphql/builder";
import { CONSTANT } from "~/constants";
import { razorpay } from "~/razorpay";

enum OrderTypeEnum {
  FEST_REGISTRATION = "FEST_REGISTRATION",
  EVENT_REGISTRATION = "EVENT_REGISTRATION",
}

const OrderType = builder.enumType(OrderTypeEnum, {
  name: "OrderType",
});

builder.mutationField("createPaymentOrder", (t) =>
  t.prismaField({
    type: "PaymentOrder",
    args: {
      type: t.arg({
        type: OrderType,
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");
      if (
        user.role === "ORGANIZER" ||
        user.role === "PARTICIPANT" ||
        user.role === "BRANCH_REP"
      )
        throw new Error("Already Registered");

      if (args.type === OrderTypeEnum.EVENT_REGISTRATION)
        // EVENT_REGISTRATION
        throw new Error("Not implemented");

      // FEST_REGISTRATION
      // check if user already has a pending order for FEST_REGISTRATION
      if (user.role !== "USER") throw new Error("Already Registered");

      const serverSettings = await ctx.prisma.serverSettings.findFirst();
      if (!serverSettings) throw new Error("Something went wrong!");
      if (!serverSettings.registrationsOpen)
        throw new Error("Registrations are closed!");

      const existingOrder = await ctx.prisma.paymentOrder.findFirst({
        where: {
          User: {
            id: user.id,
          },
          type: args.type,
          status: "PENDING",
        },
      });

      if (existingOrder)
        await ctx.prisma.paymentOrder.delete({
          where: {
            id: existingOrder.id,
          },
        });

      //set amount for external colleges
      let amount = CONSTANT.REG_AMOUNT_IN_INR.EXTERNAL;
      //set amount for nmamit.in email
      if (user.College.id === CONSTANT.INTERNAL_COLLEGE_ID)
        amount = CONSTANT.REG_AMOUNT_IN_INR.INTERNAL;
      else if (user.College.type === "OTHER")
        amount = CONSTANT.REG_AMOUNT_IN_INR.OTHER;

      const payment_capture = 1;

      const currency = "INR";

      const options = {
        //setting the commisison to 2% for the payment gateway
        amount: (Math.ceil(amount / 0.98) * 100).toString(),
        currency,
        payment_capture,
      };

      try {
        const response = await razorpay.orders.create(options);

        return ctx.prisma.paymentOrder.create({
          ...query,
          data: {
            amount: Number(response.amount),
            status: "PENDING",
            type: args.type,
            User: {
              connect: {
                id: user.id,
              },
            },
            orderId: response.id,
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error(
          "Something went wrong! Couldn't create registration order",
        );
      }
    },
  }),
);

builder.mutationField("eventPaymentOrder", (t) =>
  t.prismaField({
    type: "EventPaymentOrder",
    args: {
      teamId: t.arg({
        type: "ID",
        required: true,
      }),
    },
    errors: {
      types: [Error],
    },
    resolve: async (query, root, args, ctx, info) => {
      const user = await ctx.user;
      if (!user) throw new Error("Not authenticated");

      const team = await ctx.prisma.team.findUnique({
        where: {
          id: Number(args.teamId),
        },
        include: {
          Event: true,
          TeamMembers: true,
        },
      });
      if (!team) throw new Error("Team not found");
      if (team.Event.fees === 0) throw new Error("Event is free");

      if (
        team.Event.minTeamSize &&
        team.TeamMembers.length < team.Event.minTeamSize
      )
        throw new Error(
          `Still need ${team.Event.minTeamSize} members to register`,
        );

      if (
        team.Event.maxTeamSize &&
        team.TeamMembers.length > team.Event.maxTeamSize
      )
        throw new Error(
          `Team size exceeded. Max team size is ${team.Event.maxTeamSize}`,
        );

      if (team.confirmed) throw new Error("Already confirmed");

      if (user.id != team.leaderId)
        throw new Error("Oops! You are Not the leader");

      const payment_capture = 1;
      const amount = Math.ceil(team.Event.fees / 0.98);
      const currency = "INR";

      const options = {
        amount: (amount * 100).toString(),
        currency,
        payment_capture,
      };

      try {
        const response = await razorpay.orders.create(options);

        return ctx.prisma.eventPaymentOrder.create({
          ...query,
          data: {
            amount: Number(response.amount),
            status: "PENDING",
            Team: {
              connect: {
                id: team.id,
              },
            },
            orderId: response.id,
          },
        });
      } catch (e) {
        console.log(e);
        throw new Error("Something went wrong! Couldn't create event order");
      }
    },
  }),
);
