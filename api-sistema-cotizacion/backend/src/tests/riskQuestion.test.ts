import request from "supertest";
import app from "../app";
import { riskQuestionService } from "../services/riskQuestion.service";
import { authProvider } from "../config/auth.provider";

jest.mock("../config/auth.provider", () => ({
  authProvider: {
    verifyToken: jest.fn(),
  },
}));

jest.mock("../services/riskQuestion.service", () => ({
  riskQuestionService: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

describe("RiskQuestion Controller", () => {
  const mockToken = "mock-bearer-token";
  const mockUser = { sub: "dealer-123", email: "dealer@test.com", provider: "local" };

  beforeEach(() => {
    jest.clearAllMocks();
    (authProvider.verifyToken as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /api/dealer/risk-questions", () => {
    it("should return 200 with list of questions", async () => {
      const mockResult = [{ id: "q-1", text: "Do you ride daily?" }];
      (riskQuestionService.list as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get("/api/dealer/risk-questions")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockResult);
      expect(riskQuestionService.list).toHaveBeenCalled();
    });
  });

  describe("POST /api/dealer/risk-questions", () => {
    it("should return 400 if text is missing", async () => {
      const res = await request(app)
        .post("/api/dealer/risk-questions")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.errors).toContain("text es requerido");
    });

    it("should return 201 on success", async () => {
      const payload = { text: "Do you ride daily?", groupId: "group-1" };
      const mockQuestion = { id: "q-1", ...payload };
      (riskQuestionService.create as jest.Mock).mockResolvedValue(mockQuestion);

      const res = await request(app)
        .post("/api/dealer/risk-questions")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockQuestion);
      expect(riskQuestionService.create).toHaveBeenCalledWith(payload);
    });
  });

  describe("PUT /api/dealer/risk-questions/:id", () => {
    it("should return 200 on success", async () => {
      const payload = { text: "Do you ride weekly?" };
      const mockQuestion = { id: "q-1", text: "Do you ride weekly?", groupId: "group-1" };
      (riskQuestionService.update as jest.Mock).mockResolvedValue(mockQuestion);

      const res = await request(app)
        .put("/api/dealer/risk-questions/q-1")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockQuestion);
      expect(riskQuestionService.update).toHaveBeenCalledWith("q-1", payload);
    });
  });

  describe("DELETE /api/dealer/risk-questions/:id", () => {
    it("should return 204 on success", async () => {
      (riskQuestionService.remove as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .delete("/api/dealer/risk-questions/q-1")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(204);
      expect(riskQuestionService.remove).toHaveBeenCalledWith("q-1");
    });
  });
});
