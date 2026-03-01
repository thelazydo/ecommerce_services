import { Order } from "@domain/entities/Order";

export interface IOrderRepository {
    findById(id: string): Promise<Order | null>;
    save(order: Order): Promise<Order>;
    update(order: Order): Promise<Order>;
}
