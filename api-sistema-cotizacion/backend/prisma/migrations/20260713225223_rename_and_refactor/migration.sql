-- DropForeignKey
ALTER TABLE "quote_rules" DROP CONSTRAINT IF EXISTS "quote_rules_dealershipId_fkey";
ALTER TABLE "quote_rules" DROP CONSTRAINT IF EXISTS "quote_rules_motorcycleId_fkey";

-- Rename table and constraint
ALTER TABLE "quote_rules" RENAME TO "quote_profiles";
ALTER TABLE "quote_profiles" RENAME CONSTRAINT "quote_rules_pkey" TO "quote_profiles_pkey";

-- Alter quote_profiles columns
ALTER TABLE "quote_profiles" DROP COLUMN IF EXISTS "motorcycleId";
ALTER TABLE "quote_profiles" DROP COLUMN IF EXISTS "currency";
ALTER TABLE "quote_profiles" ADD COLUMN "minDownPayment" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "quote_profiles" ADD COLUMN "maxMonths" INTEGER NOT NULL DEFAULT 12;

-- AlterTable
ALTER TABLE "motorcycles" ADD COLUMN "quoteProfileId" TEXT;
ALTER TABLE "motorcycles" ADD COLUMN "riskQuestionGroupId" TEXT;

-- AlterTable
ALTER TABLE "risk_questions" ADD COLUMN "groupId" TEXT;

-- CreateTable
CREATE TABLE "risk_question_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_question_groups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_riskQuestionGroupId_fkey" FOREIGN KEY ("riskQuestionGroupId") REFERENCES "risk_question_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_quoteProfileId_fkey" FOREIGN KEY ("quoteProfileId") REFERENCES "quote_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_profiles" ADD CONSTRAINT "quote_profiles_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_questions" ADD CONSTRAINT "risk_questions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "risk_question_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
