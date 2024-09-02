import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import SmartSubscriptionsPlugin, {
  subscribeOptionsFromIterator,
} from "@pothos/plugin-smart-subscriptions";
import type PrismaTypes from "@pothos/plugin-prisma/generated";
import { db } from "./prisma";
import { pubsub } from "./pubsub";

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
}>({
  plugins: [PrismaPlugin, SmartSubscriptionsPlugin],
  prisma: {
    client: db,
  },
  smartSubscriptions: {
    ...subscribeOptionsFromIterator((name) => pubsub.asyncIterator(name)),
  },
});
