import { GetCustomerUseCase } from "@application/use-cases/GetCustomerUseCase";
import { ICustomerRepository } from "@domain/repositories/ICustomerRepository";
import { Customer } from "@domain/entities/Customer";
import { CustomerNotFoundError } from "@domain/errors/CustomerNotFoundError";

describe("GetCustomerUseCase", () => {
  let mockRepo: jest.Mocked<ICustomerRepository>;
  let useCase: GetCustomerUseCase;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    useCase = new GetCustomerUseCase(mockRepo);
  });

  it("should return customer DTO when found", async () => {
    mockRepo.findById.mockResolvedValue(
      new Customer("cust-1", "Jane Doe", "jane@example.com"),
    );

    const result = await useCase.execute({ id: "cust-1" });

    expect(result.id).toBe("cust-1");
    expect(result.name).toBe("Jane Doe");
    expect(result.email).toBe("jane@example.com");
    expect(mockRepo.findById).toHaveBeenCalledWith("cust-1");
  });

  it("should throw CustomerNotFoundError when not found", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: "missing-id" })).rejects.toThrow(
      CustomerNotFoundError,
    );
  });

  it("should include the id in the error message", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: "bad-id" })).rejects.toThrow(/bad-id/);
  });
});
