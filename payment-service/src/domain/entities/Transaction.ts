export class Transaction {
    constructor(
        public readonly id: string,
        public customerId: string,
        public orderId: string,
        public productId: string,
        public amount: number,
        public status: string,
        public createdAt: Date
    ) {}
}
