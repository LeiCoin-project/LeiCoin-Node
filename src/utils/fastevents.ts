import type { ObjectiveArray } from "./dataUtils.js";

export namespace FastEvents {

    export type SubscriptionID = symbol;

    export type Listener<Args extends any[]> = (...args: Args) => Promise<void> | void;

    type TopicRegistry<I extends readonly FastEvents.Topic<string, any[]>[], T = ObjectiveArray<I>> = {
        // @ts-ignore
        [K in T[keyof T]["name"]]: Extract<
            T[keyof T],
            { name: K }
        >;
    };

    export class SingleEmitter<Args extends any[] = any[]> {

        protected readonly subscribers: Record<FastEvents.SubscriptionID, FastEvents.Listener<Args>> = {};

        public on(listener: FastEvents.Listener<Args>) {
            const id = Symbol("subscriber-id");
            this.subscribers[id] = listener;
            return id as FastEvents.SubscriptionID;
        }

        public unsubscribe(id: FastEvents.SubscriptionID) {
            return delete this.subscribers[id];
        }

        async emit(...args: Args) {
            const promises: Promise<void>[] = [];

            for (const id of Object.getOwnPropertySymbols(this.subscribers)) {
                promises.push((this.subscribers[id] as any)(...args) as Promise<void>);
            }

            await Promise.all(promises);
        }

    }


    export class Topic<T extends string, Args extends any[] = any[]> extends FastEvents.SingleEmitter<Args> {
        constructor(
            readonly name: T
        ) {super()};
    }


    export class Emitter<Topics extends readonly FastEvents.Topic<string, any[]>[]> {

        readonly topics: TopicRegistry<Topics>;

        constructor(topics: [...Topics]) {
            this.topics = topics.reduce((acc, topic) => {
                (acc as any)[topic.name] = topic;
                return acc;
            }, {} as TopicRegistry<Topics>);
        }
        	
        // @ts-ignore
        public on<T extends Topics[number]["name"]>(topic: T, listener: FastEvents.Listener<Parameters<TopicRegistry<Topics>[T]["emit"]>>) {
            return (this.topics[topic] as any).on(listener) as FastEvents.SubscriptionID;
        }

        public unsubscribe<T extends Topics[number]["name"]>(topic: T, id: FastEvents.SubscriptionID) {
            return (this.topics[topic] as any).unsubscribe(id);
        }

        // @ts-ignore
        async emit<T extends Topics[number]["name"]>(topic: T, ...args: Parameters<TopicRegistry<Topics>[T]["emit"]>) {
            return (this.topics[topic] as any).emit(...args);
        }

    }

    export class SubscriberAccount<Emitter extends FastEvents.Emitter<Topics>, Topics extends readonly FastEvents.Topic<string, any[]>[]> {

        protected readonly subscriptions: Record<string, FastEvents.SubscriptionID> = {};

        constructor(
            readonly emitter: Emitter
        ) {}

        // @ts-ignore
        public on<T extends Topics[number]["name"]>(topic: T, listener: FastEvents.Listener<Parameters<TopicRegistry<Topics>[T]["emit"]>>) {
            this.subscriptions[topic] = this.emitter.on(topic, listener);
        }

        public unsubscribe<T extends Topics[number]["name"]>(topic: T) {
            this.emitter.unsubscribe(topic, this.subscriptions[topic] as FastEvents.SubscriptionID);
        }

    }

}
