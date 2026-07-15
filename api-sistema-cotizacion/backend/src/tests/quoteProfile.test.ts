import request from "supertest";
import app from "../app";
import { quoteProfileService } from "../services/quoteProfile.service";
import { authProvider } from "../config/auth.provider";

jest.mock("../config/auth.provider", () => ({
  authProvider: {
    verifyToken: jest.fn(),
  },
}));

jest.mock("../services/quoteProfile.service", () => ({
  quoteProfileService: {
    list: jest.fn(),
    findOwned: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

describe("QuoteProfile Controller", () => {
  const mockToken = "mock-bearer-token";
  const mockUser = { sub: "dealer-123", email: "dealer@test.com", provider: "local" };

  beforeEach(() => {
    jest.clearAllMocks();
    (authProvider.verifyToken as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /api/dealer/quote-profiles", () => {
    it("should return 200 with list of profiles", async () => {
      const mockResult = [{ id: "profile-1", name: "High Risk", factor: 1.5 }];
      (quoteProfileService.list as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get("/api/dealer/quote-profiles")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockResult);
      expect(quoteProfileService.list).toHaveBeenCalledWith("dealer-123");
    });
  });

  describe("GET /api/dealer/quote-profiles/:id", () => {
    it("should return 200 with single profile", async () => {
      const mockProfile = { id: "profile-1", name: "High Risk", factor: 1.5, dealershipId: "dealer-123" };
      (quoteProfileService.findOwned as jest.Mock).mockResolvedValue(mockProfile);

      const res = await request(app)
        .get("/api/dealer/quote-profiles/profile-1")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockProfile);
      expect(quoteProfileService.findOwned).toHaveBeenCalledWith("profile-1", "dealer-123");
    });
  });

  describe("POST /api/dealer/quote-profiles", () => {
    it("should return 400 if name is missing", async () => {
      const res = await request(app)
        .post("/api/dealer/quote-profiles")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ factor: 1.2 });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.errors).toContain("name es requerido");
    });

    it("should return 201 on success", async () => {
      const payload = { name: "High Risk", factor: 1.5 };
      const mockProfile = { id: "profile-1", ...payload, dealershipId: "dealer-123" };
      (quoteProfileService.create as jest.Mock).mockResolvedValue(mockProfile);

      const res = await request(app)
        .post("/api/dealer/quote-profiles")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockProfile);
      expect(quoteProfileService.create).toHaveBeenCalledWith("dealer-123", payload);
    });
  });

  describe("PUT /api/dealer/quote-profiles/:id", () => {
    it("should return 200 on success", async () => {
      const payload = { factor: 1.3 };
      const mockProfile = { id: "profile-1", name: "High Risk", factor: 1.3, dealershipId: "dealer-123" };
      (quoteProfileService.update as jest.Mock).mockResolvedValue(mockProfile);

      const res = await request(app)
        .put("/api/dealer/quote-profiles/profile-1")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockProfile);
      expect(quoteProfileService.update).toHaveBeenCalledWith("profile-1", "dealer-123", payload);
    });
  });

  describe("DELETE /api/dealer/quote-profiles/:id", () => {
    it("should return 204 on success", async () => {
      (quoteProfileService.remove as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .delete("/api/dealer/quote-profiles/profile-1")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(204);
      expect(quoteProfileService.remove).toHaveBeenCalledWith("profile-1", "dealer-123");
    });
  });
});
