import { Order } from "@domain/entities/Order";
import { IOrderRepository } from "@domain/repositories/IOrderRepository";
import { OrderModel } from "@infrastructure/persistence/mongoose-models/OrderModel";
import { OrderMapper } from "@infrastructure/persistence/mappers/OrderMapper";

export class MongoOrderRepository implements IOrderRepository {
    async findById(id: string): Promise<Order | null> {
        const doc = await OrderModel.findById(id);
        return doc ? OrderMapper.toDomain(doc) : null;
    }

    async save(order: Order): Promise<Order> {
        const data = OrderMapper.toDocument(order);
        const doc = new OrderModel(data);
        const saved = await doc.save();
        return OrderMapper.toDomain(saved);
    }

    async update(order: Order): Promise<Order> {
        const doc = await OrderModel.findByIdAndUpdate(
            order.id,
            { orderStatus: order.orderStatus },
            { returnDocument: "after" }
        );
        if (!doc) {
            throw new Error(`Order with id "${order.id}" not found for update`);
        }
        return OrderMapper.toDomain(doc);
    }
}
