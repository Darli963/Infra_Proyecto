import request from "supertest";
import app from "../app";
import { riskQuestionGroupService } from "../services/riskQuestionGroup.service";
import { authProvider } from "../config/auth.provider";

jest.mock("../config/auth.provider", () => ({
  authProvider: {
    verifyToken: jest.fn(),
  },
}));

jest.mock("../services/riskQuestionGroup.service", () => ({
  riskQuestionGroupService: {
    list: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addQuestion: jest.fn(),
  },
}));

describe("RiskQuestionGroup Controller", () => {
  const mockToken = "mock-bearer-token";
  const mockUser = { sub: "dealer-123", email: "dealer@test.com", provider: "local" };

  beforeEach(() => {
    jest.clearAllMocks();
    (authProvider.verifyToken as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /api/dealer/risk-question-groups", () => {
    it("should return 200 with list of groups", async () => {
      const mockResult = [{ id: "group-1", name: "High Displacement" }];
      (riskQuestionGroupService.list as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .get("/api/dealer/risk-question-groups")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockResult);
      expect(riskQuestionGroupService.list).toHaveBeenCalled();
    });
  });

  describe("GET /api/dealer/risk-question-groups/:id", () => {
    it("should return 200 with a specific group", async () => {
      const mockGroup = { id: "group-1", name: "High Displacement" };
      (riskQuestionGroupService.findOne as jest.Mock).mockResolvedValue(mockGroup);

      const res = await request(app)
        .get("/api/dealer/risk-question-groups/group-1")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockGroup);
      expect(riskQuestionGroupService.findOne).toHaveBeenCalledWith("group-1");
    });
  });

  describe("POST /api/dealer/risk-question-groups", () => {
    it("should return 400 if name is missing", async () => {
      const res = await request(app)
        .post("/api/dealer/risk-question-groups")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
      expect(res.body.errors).toContain("name es requerido");
    });

    it("should return 201 on success", async () => {
      const payload = { name: "High Displacement" };
      const mockGroup = { id: "group-1", ...payload };
      (riskQuestionGroupService.create as jest.Mock).mockResolvedValue(mockGroup);

      const res = await request(app)
        .post("/api/dealer/risk-question-groups")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockGroup);
      expect(riskQuestionGroupService.create).toHaveBeenCalledWith(payload);
    });
  });

  describe("PUT /api/dealer/risk-question-groups/:id", () => {
    it("should return 400 if name is missing in update", async () => {
      const res = await request(app)
        .put("/api/dealer/risk-question-groups/group-1")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should return 200 on success", async () => {
      const payload = { name: "Updated Name" };
      const mockGroup = { id: "group-1", ...payload };
      (riskQuestionGroupService.update as jest.Mock).mockResolvedValue(mockGroup);

      const res = await request(app)
        .put("/api/dealer/risk-question-groups/group-1")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockGroup);
      expect(riskQuestionGroupService.update).toHaveBeenCalledWith("group-1", payload);
    });
  });

  describe("DELETE /api/dealer/risk-question-groups/:id", () => {
    it("should return 204 on success", async () => {
      (riskQuestionGroupService.remove as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .delete("/api/dealer/risk-question-groups/group-1")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(res.status).toBe(204);
      expect(riskQuestionGroupService.remove).toHaveBeenCalledWith("group-1");
    });
  });

  describe("POST /api/dealer/risk-question-groups/:id/questions", () => {
    it("should return 400 if text is missing", async () => {
      const res = await request(app)
        .post("/api/dealer/risk-question-groups/group-1/questions")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should return 201 on success", async () => {
      const payload = { text: "What is your riding experience?", options: ["0-1 years", "1+ years"] };
      const mockResult = { id: "q-1", ...payload, groupId: "group-1" };
      (riskQuestionGroupService.addQuestion as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app)
        .post("/api/dealer/risk-question-groups/group-1/questions")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("ok");
      expect(res.body.data).toEqual(mockResult);
      expect(riskQuestionGroupService.addQuestion).toHaveBeenCalledWith("group-1", payload);
    });
  });
});
