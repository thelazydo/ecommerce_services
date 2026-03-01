export class Order {
    constructor(
        public readonly id: string,
        public customerId: string,
        public productId: string,
        public amount: number,
        public orderStatus: "pending" | "failed",
    ) { }
}
