import amqp from "amqplib";
import {
  IMessagePublisher,
  PaymentMessagePayload,
} from "@application/interfaces/IMessagePublisher";
import { logger } from "@main/config";

export class RabbitMQPublisher implements IMessagePublisher {
  private channel: any = null;
  private connection: any = null;

  async connect(url: string): Promise<void> {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // DLQ Setup
      await this.channel.assertExchange("payment.dlx", "direct", {
        durable: true,
      });
      await this.channel.assertQueue("payment.dlq", { durable: true });
      await this.channel.bindQueue(
        "payment.dlq",
        "payment.dlx",
        "payment.processed",
      );

      await this.channel.assertQueue("payment.processed", {
        deadLetterExchange: "payment.dlx",
        deadLetterRoutingKey: "payment.processed",
      });

      logger.info("Connected to RabbitMQ");
    } catch (error) {
      logger.error({ err: error }, "Failed to connect to RabbitMQ");
      throw error;
    }
  }

  publish(queue: string, payload: PaymentMessagePayload): void {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not available");
    }
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)));
    logger.info({ payload }, "Published payment to RabbitMQ");
  }

  isReady(): boolean {
    return this.channel !== null;
  }

  getChannel(): any {
    return this.channel;
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}
