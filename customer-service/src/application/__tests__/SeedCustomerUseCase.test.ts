import { SeedCustomerUseCase } from "@application/use-cases/SeedCustomerUseCase";
import { ICustomerRepository } from "@domain/repositories/ICustomerRepository";
import { IAuditLogger } from "@application/interfaces/IAuditLogger";
import { Customer } from "@domain/entities/Customer";

describe("SeedCustomerUseCase", () => {
  let mockRepo: jest.Mocked<ICustomerRepository>;
  let mockAuditLogger: jest.Mocked<IAuditLogger>;
  let useCase: SeedCustomerUseCase;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    mockAuditLogger = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SeedCustomerUseCase(mockRepo, mockAuditLogger);
  });

  it("should create a new customer when none exists", async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(
      new Customer("generated-id", "John Doe", "john.doe@example.com"),
    );

    const result = await useCase.execute({
      actorId: "admin",
      correlationId: "corr-1",
    });

    expect(mockRepo.findByEmail).toHaveBeenCalledWith("john.doe@example.com");
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(result.id).toBe("generated-id");
    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john.doe@example.com");
  });

  it("should return existing customer when already seeded (idempotency)", async () => {
    const existing = new Customer(
      "existing-id",
      "John Doe",
      "john.doe@example.com",
    );
    mockRepo.findByEmail.mockResolvedValue(existing);

    const result = await useCase.execute({
      actorId: "admin",
      correlationId: "corr-2",
    });

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(result.id).toBe("existing-id");
  });

  it("should log an audit entry after seeding", async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(
      new Customer("new-id", "John Doe", "john.doe@example.com"),
    );

    await useCase.execute({ actorId: "admin", correlationId: "corr-3" });

    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CUSTOMER_SEEDED",
        entityId: "new-id",
        entityType: "Customer",
        actorId: "admin",
        correlationId: "corr-3",
      }),
    );
  });
});
