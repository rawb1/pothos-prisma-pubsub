import { builder } from "./builder";
import { db } from "./prisma";
import { pubsub } from "./pubsub";
builder.prismaObject("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
  }),
});

builder.mutationType({
  fields: (t) => ({
    createUser: t.prismaField({
      type: "User",
      args: {
        email: t.arg.string({ required: true }),
        name: t.arg.string({ required: true }),
      },
      resolve: async (query, _, { email, name }) => {
        const user = await db.user.create({ ...query, data: { email, name } });
        pubsub.publish("userUpdated", user);
        return user;
      },
    }),
    updateUser: t.prismaField({
      type: "User",
      args: {
        id: t.arg.id({ required: true }),
        email: t.arg.string(),
        name: t.arg.string(),
      },
      resolve: async (query, _, { id, email, name }) => {
        const user = await db.user.update({
          ...query,
          where: { id },
          data: { email: email || undefined, name: name || undefined },
        });

        pubsub.publish("userUpdated", user);

        return user;
      },
    }),
  }),
});

builder.queryType({
  fields: (t) => ({
    user: t.prismaField({
      type: "User",
      smartSubscription: true,
      subscribe: async (subscriptions, parent, args, context, info) => {
        // sleep 1 sec
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return subscriptions.register("userUpdated", {
          filter: (payload: { id: string }) => payload.id === args.id,
        });
      },
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: (query, root, { id }) =>
        db.user.findUnique({ ...query, where: { id } }),
    }),
  }),
});

builder.subscriptionType({});

const schema = builder.toSchema();

export default schema;
