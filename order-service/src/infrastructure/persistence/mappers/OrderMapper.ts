import { Order } from "@domain/entities/Order";
import { IOrderDocument } from "@infrastructure/persistence/mongoose-models/OrderModel";

export class OrderMapper {
    static toDomain(doc: IOrderDocument): Order {
        return new Order(
            doc._id.toString(),
            doc.customerId,
            doc.productId,
            doc.amount,
            doc.orderStatus
        );
    }

    static toDocument(entity: Order): Partial<IOrderDocument> {
        return {
            customerId: entity.customerId,
            productId: entity.productId,
            amount: entity.amount,
            orderStatus: entity.orderStatus,
        };
    }
}
