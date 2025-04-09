import type { ObjectKeys } from "./dataUtils.js";

export namespace FastEvents {

    export type SubscriptionID = symbol;
    export type Subscriptions<T> = Record<keyof T, Set<SubscriptionID>>;

    export type Listener<Args extends any[]> = (...args: Args) => Promise<void> | void;
    export type Listeners = Map<SubscriptionID, Listener<any[]>>;


    export class SingleEmitter<Args extends any[] = any[]> {

        protected readonly listeners: Listeners = new Map();

        public on(listener: Listener<Args>, id: SubscriptionID = Symbol("subscriber-id")) {
            this.listeners.set(id, listener);
            return id;
        }

        public unsubscribe(id: SubscriptionID) {
            this.listeners.delete(id);
        }

        async emit(...args: Args) {
            const promises: Promise<void>[] = [];

            for (const listener of this.listeners.values()) {
                promises.push(listener(...args) as Promise<void>);
            }

            return Promise.all(promises);
        }

    }


    export class Emitter<Topics extends Record<string, any[]>> {

        protected readonly subscriptions: Subscriptions<Topics> = {} as any;
        protected readonly listeners: Listeners = new Map();

        constructor(topics: ObjectKeys<Topics>) {
            for (const topic of topics as (keyof Topics)[]) {
                this.subscriptions[topic] = new Set();
            }
        }

        public on<K extends keyof Topics>(topic: K, listener: Listener<Topics[K]>, id: SubscriptionID = Symbol("subscriber-id")) {
            this.subscriptions[topic].add(id);
            this.listeners.set(id, listener);
            return id;
        }

        public unsubscribe<K extends keyof Topics>(topic: K, id: SubscriptionID) {
            this.subscriptions[topic].delete(id);
            this.listeners.delete(id);
        }

        // Emit an event with type-safe arguments.
        async emit<K extends keyof Topics>(topic: K, ...args: Topics[K]) {
            const promises: Promise<void>[] = [];

            for (const id of this.subscriptions[topic]) {
                const listener = this.listeners.get(id);
                if (listener) {
                    promises.push(listener(...args) as Promise<void>);
                }
            }

            return Promise.all(promises);
        }

        public createAccount() {
            return new SubscriberAccount<Topics>(this, Symbol("subscription-id"));
        }
    }

    export class SubscriberAccount<Topics extends Record<string, any[]>> {

        protected readonly subscriptedTopics: Set<keyof Topics> = new Set();

        constructor(
            protected readonly emitter: Emitter<Topics>,
            protected readonly subscriptionID: FastEvents.SubscriptionID,
        ) {}

        public on<K extends keyof Topics>(topic: K, listener: FastEvents.Listener<Topics[K]>) {
            this.emitter.on(topic, listener, this.subscriptionID);
            this.subscriptedTopics.add(topic);
        }

        public unsubscribe<K extends keyof Topics>(topic: K) {
            this.emitter.unsubscribe(topic, this.subscriptionID);
            this.subscriptedTopics.delete(topic);
        }

    }

}
