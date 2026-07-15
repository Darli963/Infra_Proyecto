import request from "supertest";
import app from "../app";
import { quoteEngine, publicService } from "../services/quote.service";

jest.mock("../services/quote.service", () => ({
  publicService: {
    listMotorcycles: jest.fn(),
    listDealerships: jest.fn(),
    getMotorcycle: jest.fn(),
    getRiskQuestions: jest.fn(),
  },
  quoteEngine: {
    simulate: jest.fn(),
  },
}));

describe("Public / Quote Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/public/motorcycles", () => {
    it("should return 200 with list of motorcycles", async () => {
      const mockResult = { items: [{ id: "moto-1", brand: "Yamaha", model: "R3" }], total: 1 };
      (publicService.listMotorcycles as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).get("/api/public/motorcycles?search=Yamaha");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockResult);
      expect(publicService.listMotorcycles).toHaveBeenCalledWith(expect.objectContaining({ search: "Yamaha" }));
    });
  });

  describe("GET /api/public/dealerships", () => {
    it("should return 200 with list of dealerships", async () => {
      const mockResult = [{ id: "dealer-1", name: "Yamaha Store", slug: "yamaha-store" }];
      (publicService.listDealerships as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).get("/api/public/dealerships");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockResult);
      expect(publicService.listDealerships).toHaveBeenCalled();
    });
  });

  describe("POST /api/public/quote/simulate", () => {
    const validPayload = {
      motorcycleId: "moto-1",
      applicantName: "Juan Perez",
      applicantEmail: "juan@perez.com",
      responses: [
        { questionId: "q-1", optionId: "opt-1" }
      ]
    };

    it("should return 400 if validation fails due to invalid email", async () => {
      const res = await request(app)
        .post("/api/public/quote/simulate")
        .send({ ...validPayload, applicantEmail: "invalid-email" });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.errors).toContain("applicantEmail no es un email válido");
    });

    it("should return 201 on success", async () => {
      const mockSimulationResult = {
        id: "sim-123",
        basePrice: "15000",
        finalPrice: "16500",
        totalRiskFactor: "1.1",
        riskBreakdown: []
      };
      (quoteEngine.simulate as jest.Mock).mockResolvedValue(mockSimulationResult);

      const res = await request(app)
        .post("/api/public/quote/simulate")
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockSimulationResult);
      expect(quoteEngine.simulate).toHaveBeenCalledWith(validPayload);
    });
  });
});
