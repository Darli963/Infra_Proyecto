-- CreateEnum
CREATE TYPE "input_type" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'NUMBER', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "simulation_status" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "dealerships" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motorcycles" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "engineCC" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motorcycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motorcycle_images" (
    "id" TEXT NOT NULL,
    "motorcycleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "motorcycle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_rules" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "motorcycleId" TEXT,
    "name" TEXT NOT NULL,
    "factor" DECIMAL(6,4) NOT NULL,
    "fixedCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_questions" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "inputType" "input_type" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "riskFactor" DECIMAL(6,4) NOT NULL DEFAULT 1.0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "risk_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_simulations" (
    "id" TEXT NOT NULL,
    "dealershipId" TEXT NOT NULL,
    "motorcycleId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "simulation_status" NOT NULL DEFAULT 'DRAFT',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_responses" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "textValue" TEXT,

    CONSTRAINT "simulation_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealerships_slug_key" ON "dealerships"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "dealerships_email_key" ON "dealerships"("email");

-- CreateIndex
CREATE UNIQUE INDEX "simulation_responses_simulationId_questionId_key" ON "simulation_responses"("simulationId", "questionId");

-- AddForeignKey
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motorcycle_images" ADD CONSTRAINT "motorcycle_images_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "motorcycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_rules" ADD CONSTRAINT "quote_rules_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_rules" ADD CONSTRAINT "quote_rules_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "motorcycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_question_options" ADD CONSTRAINT "risk_question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "risk_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_simulations" ADD CONSTRAINT "quote_simulations_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_simulations" ADD CONSTRAINT "quote_simulations_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "motorcycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_responses" ADD CONSTRAINT "simulation_responses_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "quote_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_responses" ADD CONSTRAINT "simulation_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "risk_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_responses" ADD CONSTRAINT "simulation_responses_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "risk_question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
