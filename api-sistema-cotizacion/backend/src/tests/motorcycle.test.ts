import request from "supertest";
import app from "../app";
import { motorcycleService } from "../services/motorcycle.service";
import { authProvider } from "../config/auth.provider";

jest.mock("../config/auth.provider", () => ({
  authProvider: {
    verifyToken: jest.fn(),
  },
}));

jest.mock("../services/motorcycle.service", () => ({
  motorcycleService: {
    list: jest.fn(),
    findOwned: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

describe("Motorcycle Controller", () => {
  const mockToken = "mock-bearer-token";
  const mockUser = { sub: "dealer-123", email: "dealer@test.com", provider: "local" };

  beforeEach(() => {
    jest.clearAllMocks();
    (authProvider.verifyToken as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /api/dealer/motorcycles", () => {
    it("should return 401 if token is not provided", async () => {
      const res = await request(app).get("/api/dealer/motorcycles");
      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
    });

    it("should return 200 with list of motorcycles", async () => {
      const mockResult = { items: [{ id: "moto-1", brand: "Honda" }], total: 1, page: 1, limit: 20, pages: 1 };
      (motorcycleService.list as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get("/api/dealer/motorcycles")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockResult);
      expect(motorcycleService.list).toHaveBeenCalledWith("dealer-123", expect.any(Object));
    });
  });

  describe("GET /api/dealer/motorcycles/:id", () => {
    it("should return 200 with a specific motorcycle", async () => {
      const mockMoto = { id: "moto-1", brand: "Honda", model: "CBR", dealershipId: "dealer-123" };
      (motorcycleService.findOwned as jest.Mock).mockResolvedValue(mockMoto);

      const res = await request(app)
        .get("/api/dealer/motorcycles/moto-1")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockMoto);
      expect(motorcycleService.findOwned).toHaveBeenCalledWith("moto-1", "dealer-123");
    });

    it("should propagate errors from the service", async () => {
      const error = Object.assign(new Error("Motocicleta no encontrada"), { status: 404 });
      (motorcycleService.findOwned as jest.Mock).mockRejectedValue(error);

      const res = await request(app)
        .get("/api/dealer/motorcycles/moto-none")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe("error");
    });
  });

  describe("POST /api/dealer/motorcycles", () => {
    const validPayload = {
      brand: "Honda",
      model: "CBR",
      year: 2024,
      engineCC: 600,
      price: 12000,
      category: "Sport"
    };

    it("should return 400 if validation fails", async () => {
      const res = await request(app)
        .post("/api/dealer/motorcycles")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ brand: "Honda" }); // missing required fields

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.errors).toContain("model es requerido");
    });

    it("should return 201 on success", async () => {
      const mockMoto = { id: "moto-1", ...validPayload, dealershipId: "dealer-123" };
      (motorcycleService.create as jest.Mock).mockResolvedValue(mockMoto);

      const res = await request(app)
        .post("/api/dealer/motorcycles")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockMoto);
      expect(motorcycleService.create).toHaveBeenCalledWith("dealer-123", validPayload);
    });
  });

  describe("PUT /api/dealer/motorcycles/:id", () => {
    it("should return 200 on success", async () => {
      const updatePayload = { price: 11500 };
      const mockMoto = { id: "moto-1", brand: "Honda", model: "CBR", price: 11500, dealershipId: "dealer-123" };
      (motorcycleService.update as jest.Mock).mockResolvedValue(mockMoto);

      const res = await request(app)
        .put("/api/dealer/motorcycles/moto-1")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockMoto);
      expect(motorcycleService.update).toHaveBeenCalledWith("moto-1", "dealer-123", updatePayload);
    });
  });

  describe("DELETE /api/dealer/motorcycles/:id", () => {
    it("should return 204 on success", async () => {
      (motorcycleService.remove as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .delete("/api/dealer/motorcycles/moto-1")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(204);
      expect(motorcycleService.remove).toHaveBeenCalledWith("moto-1", "dealer-123");
    });
  });
});
