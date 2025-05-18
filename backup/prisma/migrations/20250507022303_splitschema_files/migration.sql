-- CreateEnum
CREATE TYPE "EventScopeLevel" AS ENUM ('Organization', 'ART', 'Team');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('Planning', 'NominationsOpen', 'VotingOpen', 'Judging', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "FeedbackRequestStatus" AS ENUM ('Pending', 'Completed', 'Declined');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('General', 'Performance');

-- CreateEnum
CREATE TYPE "PerformanceContext" AS ENUM ('Sprint', 'PI', 'Overall');

-- CreateEnum
CREATE TYPE "TeamFeedbackStatus" AS ENUM ('Draft', 'Submitted');

-- CreateTable
CREATE TABLE "ART" (
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "ART_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "awardDate" TIMESTAMP(3) NOT NULL,
    "justification" TEXT,
    "awardValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "recipientEmployeeId" INTEGER NOT NULL,
    "awardCategoryId" INTEGER NOT NULL,
    "winningNominationId" INTEGER,
    "nominatorEmployeeId" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardCategory" (
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "categoryNameId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "AwardCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nomination" (
    "nominationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "awardCategoryId" INTEGER NOT NULL,
    "nomineeEmployeeId" INTEGER NOT NULL,
    "nominatorEmployeeId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "Nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "voteDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justification" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "nominationId" INTEGER NOT NULL,
    "voterEmployeeId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lanId" TEXT NOT NULL,
    "isContractor" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "cignaManagerId" INTEGER,
    "updatedById" INTEGER,
    "isUserActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeARTLink" (
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" INTEGER NOT NULL,
    "artId" INTEGER NOT NULL,

    CONSTRAINT "EmployeeARTLink_pkey" PRIMARY KEY ("employeeId","artId","role")
);

-- CreateTable
CREATE TABLE "EmployeeAchievement" (
    "description" TEXT NOT NULL,
    "achievementDate" TIMESTAMP(3) NOT NULL,
    "dateLogged" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "EmployeeAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeOrgLink" (
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,

    CONSTRAINT "EmployeeOrgLink_pkey" PRIMARY KEY ("employeeId","organizationId","role")
);

-- CreateTable
CREATE TABLE "EmployeeTeamLink" (
    "jobTitle" TEXT NOT NULL,
    "isTeamOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "EmployeeTeamLink_pkey" PRIMARY KEY ("employeeId","teamId")
);

-- CreateTable
CREATE TABLE "Event" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "nominationEndDate" TIMESTAMP(3),
    "status" "EventStatus" NOT NULL DEFAULT 'Planning',
    "scopeLevel" "EventScopeLevel" NOT NULL,
    "isVotingAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isNominationAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "eventTypeId" INTEGER NOT NULL,
    "eventOwnerId" INTEGER NOT NULL,
    "scopeOrganizationId" INTEGER,
    "scopeArtId" INTEGER,
    "scopeTeamId" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventJudge" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" INTEGER NOT NULL,
    "judgeEmployeeId" INTEGER NOT NULL,

    CONSTRAINT "EventJudge_pkey" PRIMARY KEY ("eventId","judgeEmployeeId")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "feedbackType" "FeedbackType" NOT NULL,
    "isManagerOnly" BOOLEAN NOT NULL DEFAULT false,
    "dateSubmitted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performanceContext" "PerformanceContext",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "giverEmployeeId" INTEGER NOT NULL,
    "receiverEmployeeId" INTEGER NOT NULL,
    "performanceCycleId" INTEGER,
    "feedbackRequestId" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackGeneralQA" (
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "feedbackId" INTEGER NOT NULL,

    CONSTRAINT "FeedbackGeneralQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackRating" (
    "ratingValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "feedbackId" INTEGER NOT NULL,
    "ratingCategoryId" INTEGER NOT NULL,

    CONSTRAINT "FeedbackRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackRequest" (
    "requestedFeedbackType" "FeedbackType" NOT NULL,
    "status" "FeedbackRequestStatus" NOT NULL DEFAULT 'Pending',
    "dateRequested" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performanceContext" "PerformanceContext",
    "message" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "requesterEmployeeId" INTEGER NOT NULL,
    "requestedFromEmployeeId" INTEGER NOT NULL,
    "requestedForEmployeeId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "FeedbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceCycle" (
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "PerformanceCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceFeedbackResponse" (
    "employeeResponse" TEXT,
    "managerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "feedbackId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "employeeResponderId" INTEGER,
    "managerResponderId" INTEGER,

    CONSTRAINT "PerformanceFeedbackResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceQuestion" (
    "questionText" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "PerformanceQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingCategory" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "RatingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceAwardCategoryName" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "ReferenceAwardCategoryName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceEventType" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "ReferenceEventType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "artId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamFeedbackRating" (
    "ratingValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,
    "teamFeedbackId" INTEGER NOT NULL,
    "teamCategoryId" INTEGER NOT NULL,

    CONSTRAINT "TeamFeedbackRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPerformanceFeedback" (
    "dateSubmitted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TeamFeedbackStatus" NOT NULL DEFAULT 'Draft',
    "overallComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "performanceCycleId" INTEGER NOT NULL,
    "giverEmployeeId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "TeamPerformanceFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPerformanceFeedbackResponse" (
    "responseText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "teamFeedbackId" INTEGER NOT NULL,
    "teamQuestionId" INTEGER NOT NULL,

    CONSTRAINT "TeamPerformanceFeedbackResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPerformanceQuestion" (
    "questionText" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "TeamPerformanceQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRatingCategory" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "createdById" INTEGER,
    "updatedById" INTEGER,

    CONSTRAINT "TeamRatingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ART_createdById_idx" ON "ART"("createdById");

-- CreateIndex
CREATE INDEX "ART_organizationId_idx" ON "ART"("organizationId");

-- CreateIndex
CREATE INDEX "ART_updatedById_idx" ON "ART"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "ART_name_organizationId_key" ON "ART"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Award_winningNominationId_key" ON "Award"("winningNominationId");

-- CreateIndex
CREATE INDEX "Award_awardCategoryId_idx" ON "Award"("awardCategoryId");

-- CreateIndex
CREATE INDEX "Award_createdById_idx" ON "Award"("createdById");

-- CreateIndex
CREATE INDEX "Award_nominatorEmployeeId_idx" ON "Award"("nominatorEmployeeId");

-- CreateIndex
CREATE INDEX "Award_recipientEmployeeId_idx" ON "Award"("recipientEmployeeId");

-- CreateIndex
CREATE INDEX "Award_updatedById_idx" ON "Award"("updatedById");

-- CreateIndex
CREATE INDEX "AwardCategory_categoryNameId_idx" ON "AwardCategory"("categoryNameId");

-- CreateIndex
CREATE INDEX "AwardCategory_createdById_idx" ON "AwardCategory"("createdById");

-- CreateIndex
CREATE INDEX "AwardCategory_eventId_idx" ON "AwardCategory"("eventId");

-- CreateIndex
CREATE INDEX "AwardCategory_updatedById_idx" ON "AwardCategory"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "AwardCategory_eventId_categoryNameId_key" ON "AwardCategory"("eventId", "categoryNameId");

-- CreateIndex
CREATE INDEX "Nomination_awardCategoryId_idx" ON "Nomination"("awardCategoryId");

-- CreateIndex
CREATE INDEX "Nomination_createdById_idx" ON "Nomination"("createdById");

-- CreateIndex
CREATE INDEX "Nomination_nominatorEmployeeId_idx" ON "Nomination"("nominatorEmployeeId");

-- CreateIndex
CREATE INDEX "Nomination_nomineeEmployeeId_idx" ON "Nomination"("nomineeEmployeeId");

-- CreateIndex
CREATE INDEX "Nomination_updatedById_idx" ON "Nomination"("updatedById");

-- CreateIndex
CREATE INDEX "Vote_createdById_idx" ON "Vote"("createdById");

-- CreateIndex
CREATE INDEX "Vote_nominationId_idx" ON "Vote"("nominationId");

-- CreateIndex
CREATE INDEX "Vote_updatedById_idx" ON "Vote"("updatedById");

-- CreateIndex
CREATE INDEX "Vote_voterEmployeeId_idx" ON "Vote"("voterEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_nominationId_voterEmployeeId_key" ON "Vote"("nominationId", "voterEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_lanId_key" ON "Employee"("lanId");

-- CreateIndex
CREATE INDEX "Employee_cignaManagerId_idx" ON "Employee"("cignaManagerId");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_lanId_idx" ON "Employee"("lanId");

-- CreateIndex
CREATE INDEX "Employee_updatedById_idx" ON "Employee"("updatedById");

-- CreateIndex
CREATE INDEX "EmployeeARTLink_artId_idx" ON "EmployeeARTLink"("artId");

-- CreateIndex
CREATE INDEX "EmployeeARTLink_employeeId_idx" ON "EmployeeARTLink"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeAchievement_achievementDate_idx" ON "EmployeeAchievement"("achievementDate");

-- CreateIndex
CREATE INDEX "EmployeeAchievement_createdById_idx" ON "EmployeeAchievement"("createdById");

-- CreateIndex
CREATE INDEX "EmployeeAchievement_employeeId_idx" ON "EmployeeAchievement"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeAchievement_updatedById_idx" ON "EmployeeAchievement"("updatedById");

-- CreateIndex
CREATE INDEX "EmployeeOrgLink_employeeId_idx" ON "EmployeeOrgLink"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeOrgLink_organizationId_idx" ON "EmployeeOrgLink"("organizationId");

-- CreateIndex
CREATE INDEX "EmployeeTeamLink_employeeId_idx" ON "EmployeeTeamLink"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeTeamLink_teamId_idx" ON "EmployeeTeamLink"("teamId");

-- CreateIndex
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");

-- CreateIndex
CREATE INDEX "Event_eventOwnerId_idx" ON "Event"("eventOwnerId");

-- CreateIndex
CREATE INDEX "Event_eventTypeId_idx" ON "Event"("eventTypeId");

-- CreateIndex
CREATE INDEX "Event_scopeArtId_idx" ON "Event"("scopeArtId");

-- CreateIndex
CREATE INDEX "Event_scopeLevel_idx" ON "Event"("scopeLevel");

-- CreateIndex
CREATE INDEX "Event_scopeOrganizationId_idx" ON "Event"("scopeOrganizationId");

-- CreateIndex
CREATE INDEX "Event_scopeTeamId_idx" ON "Event"("scopeTeamId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_updatedById_idx" ON "Event"("updatedById");

-- CreateIndex
CREATE INDEX "EventJudge_eventId_idx" ON "EventJudge"("eventId");

-- CreateIndex
CREATE INDEX "EventJudge_judgeEmployeeId_idx" ON "EventJudge"("judgeEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_feedbackRequestId_key" ON "Feedback"("feedbackRequestId");

-- CreateIndex
CREATE INDEX "Feedback_createdById_idx" ON "Feedback"("createdById");

-- CreateIndex
CREATE INDEX "Feedback_feedbackType_idx" ON "Feedback"("feedbackType");

-- CreateIndex
CREATE INDEX "Feedback_giverEmployeeId_idx" ON "Feedback"("giverEmployeeId");

-- CreateIndex
CREATE INDEX "Feedback_isManagerOnly_idx" ON "Feedback"("isManagerOnly");

-- CreateIndex
CREATE INDEX "Feedback_performanceCycleId_idx" ON "Feedback"("performanceCycleId");

-- CreateIndex
CREATE INDEX "Feedback_receiverEmployeeId_idx" ON "Feedback"("receiverEmployeeId");

-- CreateIndex
CREATE INDEX "Feedback_updatedById_idx" ON "Feedback"("updatedById");

-- CreateIndex
CREATE INDEX "FeedbackGeneralQA_feedbackId_idx" ON "FeedbackGeneralQA"("feedbackId");

-- CreateIndex
CREATE INDEX "FeedbackRating_feedbackId_idx" ON "FeedbackRating"("feedbackId");

-- CreateIndex
CREATE INDEX "FeedbackRating_ratingCategoryId_idx" ON "FeedbackRating"("ratingCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackRating_feedbackId_ratingCategoryId_key" ON "FeedbackRating"("feedbackId", "ratingCategoryId");

-- CreateIndex
CREATE INDEX "FeedbackRequest_createdById_idx" ON "FeedbackRequest"("createdById");

-- CreateIndex
CREATE INDEX "FeedbackRequest_dueDate_idx" ON "FeedbackRequest"("dueDate");

-- CreateIndex
CREATE INDEX "FeedbackRequest_requestedForEmployeeId_idx" ON "FeedbackRequest"("requestedForEmployeeId");

-- CreateIndex
CREATE INDEX "FeedbackRequest_requestedFromEmployeeId_idx" ON "FeedbackRequest"("requestedFromEmployeeId");

-- CreateIndex
CREATE INDEX "FeedbackRequest_requesterEmployeeId_idx" ON "FeedbackRequest"("requesterEmployeeId");

-- CreateIndex
CREATE INDEX "FeedbackRequest_status_idx" ON "FeedbackRequest"("status");

-- CreateIndex
CREATE INDEX "FeedbackRequest_updatedById_idx" ON "FeedbackRequest"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "Organization_createdById_idx" ON "Organization"("createdById");

-- CreateIndex
CREATE INDEX "Organization_updatedById_idx" ON "Organization"("updatedById");

-- CreateIndex
CREATE INDEX "PerformanceCycle_createdById_idx" ON "PerformanceCycle"("createdById");

-- CreateIndex
CREATE INDEX "PerformanceCycle_isActive_idx" ON "PerformanceCycle"("isActive");

-- CreateIndex
CREATE INDEX "PerformanceCycle_organizationId_idx" ON "PerformanceCycle"("organizationId");

-- CreateIndex
CREATE INDEX "PerformanceCycle_updatedById_idx" ON "PerformanceCycle"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceCycle_name_organizationId_key" ON "PerformanceCycle"("name", "organizationId");

-- CreateIndex
CREATE INDEX "PerformanceFeedbackResponse_employeeResponderId_idx" ON "PerformanceFeedbackResponse"("employeeResponderId");

-- CreateIndex
CREATE INDEX "PerformanceFeedbackResponse_feedbackId_idx" ON "PerformanceFeedbackResponse"("feedbackId");

-- CreateIndex
CREATE INDEX "PerformanceFeedbackResponse_managerResponderId_idx" ON "PerformanceFeedbackResponse"("managerResponderId");

-- CreateIndex
CREATE INDEX "PerformanceFeedbackResponse_questionId_idx" ON "PerformanceFeedbackResponse"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceFeedbackResponse_feedbackId_questionId_key" ON "PerformanceFeedbackResponse"("feedbackId", "questionId");

-- CreateIndex
CREATE INDEX "PerformanceQuestion_createdById_idx" ON "PerformanceQuestion"("createdById");

-- CreateIndex
CREATE INDEX "PerformanceQuestion_isActive_idx" ON "PerformanceQuestion"("isActive");

-- CreateIndex
CREATE INDEX "PerformanceQuestion_updatedById_idx" ON "PerformanceQuestion"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "RatingCategory_name_key" ON "RatingCategory"("name");

-- CreateIndex
CREATE INDEX "RatingCategory_createdById_idx" ON "RatingCategory"("createdById");

-- CreateIndex
CREATE INDEX "RatingCategory_isActive_idx" ON "RatingCategory"("isActive");

-- CreateIndex
CREATE INDEX "RatingCategory_updatedById_idx" ON "RatingCategory"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceAwardCategoryName_name_key" ON "ReferenceAwardCategoryName"("name");

-- CreateIndex
CREATE INDEX "ReferenceAwardCategoryName_createdById_idx" ON "ReferenceAwardCategoryName"("createdById");

-- CreateIndex
CREATE INDEX "ReferenceAwardCategoryName_isActive_idx" ON "ReferenceAwardCategoryName"("isActive");

-- CreateIndex
CREATE INDEX "ReferenceAwardCategoryName_updatedById_idx" ON "ReferenceAwardCategoryName"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceEventType_name_key" ON "ReferenceEventType"("name");

-- CreateIndex
CREATE INDEX "ReferenceEventType_createdById_idx" ON "ReferenceEventType"("createdById");

-- CreateIndex
CREATE INDEX "ReferenceEventType_isActive_idx" ON "ReferenceEventType"("isActive");

-- CreateIndex
CREATE INDEX "ReferenceEventType_updatedById_idx" ON "ReferenceEventType"("updatedById");

-- CreateIndex
CREATE INDEX "Team_artId_idx" ON "Team"("artId");

-- CreateIndex
CREATE INDEX "Team_createdById_idx" ON "Team"("createdById");

-- CreateIndex
CREATE INDEX "Team_updatedById_idx" ON "Team"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_artId_key" ON "Team"("name", "artId");

-- CreateIndex
CREATE INDEX "TeamFeedbackRating_teamCategoryId_idx" ON "TeamFeedbackRating"("teamCategoryId");

-- CreateIndex
CREATE INDEX "TeamFeedbackRating_teamFeedbackId_idx" ON "TeamFeedbackRating"("teamFeedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamFeedbackRating_teamFeedbackId_teamCategoryId_key" ON "TeamFeedbackRating"("teamFeedbackId", "teamCategoryId");

-- CreateIndex
CREATE INDEX "TeamPerformanceFeedback_createdById_idx" ON "TeamPerformanceFeedback"("createdById");

-- CreateIndex
CREATE INDEX "TeamPerformanceFeedback_giverEmployeeId_idx" ON "TeamPerformanceFeedback"("giverEmployeeId");

-- CreateIndex
CREATE INDEX "TeamPerformanceFeedback_performanceCycleId_idx" ON "TeamPerformanceFeedback"("performanceCycleId");

-- CreateIndex
CREATE INDEX "TeamPerformanceFeedback_status_idx" ON "TeamPerformanceFeedback"("status");

-- CreateIndex
CREATE INDEX "TeamPerformanceFeedback_teamId_idx" ON "TeamPerformanceFeedback"("teamId");

-- CreateIndex
CREATE INDEX "TeamPerformanceFeedback_updatedById_idx" ON "TeamPerformanceFeedback"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPerformanceFeedback_teamId_performanceCycleId_giverEmpl_key" ON "TeamPerformanceFeedback"("teamId", "performanceCycleId", "giverEmployeeId");

-- CreateIndex
CREATE INDEX "TeamPerformanceFeedbackResponse_teamFeedbackId_idx" ON "TeamPerformanceFeedbackResponse"("teamFeedbackId");

-- CreateIndex
CREATE INDEX "TeamPerformanceFeedbackResponse_teamQuestionId_idx" ON "TeamPerformanceFeedbackResponse"("teamQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPerformanceFeedbackResponse_teamFeedbackId_teamQuestion_key" ON "TeamPerformanceFeedbackResponse"("teamFeedbackId", "teamQuestionId");

-- CreateIndex
CREATE INDEX "TeamPerformanceQuestion_createdById_idx" ON "TeamPerformanceQuestion"("createdById");

-- CreateIndex
CREATE INDEX "TeamPerformanceQuestion_isActive_idx" ON "TeamPerformanceQuestion"("isActive");

-- CreateIndex
CREATE INDEX "TeamPerformanceQuestion_updatedById_idx" ON "TeamPerformanceQuestion"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRatingCategory_name_key" ON "TeamRatingCategory"("name");

-- CreateIndex
CREATE INDEX "TeamRatingCategory_createdById_idx" ON "TeamRatingCategory"("createdById");

-- CreateIndex
CREATE INDEX "TeamRatingCategory_isActive_idx" ON "TeamRatingCategory"("isActive");

-- CreateIndex
CREATE INDEX "TeamRatingCategory_updatedById_idx" ON "TeamRatingCategory"("updatedById");

-- AddForeignKey
ALTER TABLE "ART" ADD CONSTRAINT "ART_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ART" ADD CONSTRAINT "ART_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ART" ADD CONSTRAINT "ART_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_awardCategoryId_fkey" FOREIGN KEY ("awardCategoryId") REFERENCES "AwardCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_nominatorEmployeeId_fkey" FOREIGN KEY ("nominatorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_recipientEmployeeId_fkey" FOREIGN KEY ("recipientEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_winningNominationId_fkey" FOREIGN KEY ("winningNominationId") REFERENCES "Nomination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardCategory" ADD CONSTRAINT "AwardCategory_categoryNameId_fkey" FOREIGN KEY ("categoryNameId") REFERENCES "ReferenceAwardCategoryName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardCategory" ADD CONSTRAINT "AwardCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardCategory" ADD CONSTRAINT "AwardCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardCategory" ADD CONSTRAINT "AwardCategory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_awardCategoryId_fkey" FOREIGN KEY ("awardCategoryId") REFERENCES "AwardCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_nominatorEmployeeId_fkey" FOREIGN KEY ("nominatorEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_nomineeEmployeeId_fkey" FOREIGN KEY ("nomineeEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "Nomination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterEmployeeId_fkey" FOREIGN KEY ("voterEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_cignaManagerId_fkey" FOREIGN KEY ("cignaManagerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeARTLink" ADD CONSTRAINT "EmployeeARTLink_artId_fkey" FOREIGN KEY ("artId") REFERENCES "ART"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeARTLink" ADD CONSTRAINT "EmployeeARTLink_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAchievement" ADD CONSTRAINT "EmployeeAchievement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAchievement" ADD CONSTRAINT "EmployeeAchievement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAchievement" ADD CONSTRAINT "EmployeeAchievement_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeOrgLink" ADD CONSTRAINT "EmployeeOrgLink_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeOrgLink" ADD CONSTRAINT "EmployeeOrgLink_orgAdminLink_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EmployeeTeamLink" ADD CONSTRAINT "EmployeeTeamLink_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeamLink" ADD CONSTRAINT "EmployeeTeamLink_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventOwnerId_fkey" FOREIGN KEY ("eventOwnerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "ReferenceEventType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_scopeArtId_fkey" FOREIGN KEY ("scopeArtId") REFERENCES "ART"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_scopeOrganizationId_fkey" FOREIGN KEY ("scopeOrganizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_scopeTeamId_fkey" FOREIGN KEY ("scopeTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventJudge" ADD CONSTRAINT "EventJudge_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventJudge" ADD CONSTRAINT "EventJudge_judgeEmployeeId_fkey" FOREIGN KEY ("judgeEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_feedbackRequestId_fkey" FOREIGN KEY ("feedbackRequestId") REFERENCES "FeedbackRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_giverEmployeeId_fkey" FOREIGN KEY ("giverEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_performanceCycleId_fkey" FOREIGN KEY ("performanceCycleId") REFERENCES "PerformanceCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_receiverEmployeeId_fkey" FOREIGN KEY ("receiverEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackGeneralQA" ADD CONSTRAINT "FeedbackGeneralQA_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRating" ADD CONSTRAINT "FeedbackRating_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRating" ADD CONSTRAINT "FeedbackRating_ratingCategoryId_fkey" FOREIGN KEY ("ratingCategoryId") REFERENCES "RatingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_requestedForEmployeeId_fkey" FOREIGN KEY ("requestedForEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_requestedFromEmployeeId_fkey" FOREIGN KEY ("requestedFromEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_requesterEmployeeId_fkey" FOREIGN KEY ("requesterEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceCycle" ADD CONSTRAINT "PerformanceCycle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceCycle" ADD CONSTRAINT "PerformanceCycle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceCycle" ADD CONSTRAINT "PerformanceCycle_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceFeedbackResponse" ADD CONSTRAINT "PerformanceFeedbackResponse_employeeResponderId_fkey" FOREIGN KEY ("employeeResponderId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceFeedbackResponse" ADD CONSTRAINT "PerformanceFeedbackResponse_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceFeedbackResponse" ADD CONSTRAINT "PerformanceFeedbackResponse_managerResponderId_fkey" FOREIGN KEY ("managerResponderId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceFeedbackResponse" ADD CONSTRAINT "PerformanceFeedbackResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PerformanceQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceQuestion" ADD CONSTRAINT "PerformanceQuestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceQuestion" ADD CONSTRAINT "PerformanceQuestion_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingCategory" ADD CONSTRAINT "RatingCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingCategory" ADD CONSTRAINT "RatingCategory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceAwardCategoryName" ADD CONSTRAINT "ReferenceAwardCategoryName_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceAwardCategoryName" ADD CONSTRAINT "ReferenceAwardCategoryName_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceEventType" ADD CONSTRAINT "ReferenceEventType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceEventType" ADD CONSTRAINT "ReferenceEventType_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_artId_fkey" FOREIGN KEY ("artId") REFERENCES "ART"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFeedbackRating" ADD CONSTRAINT "TeamFeedbackRating_teamCategoryId_fkey" FOREIGN KEY ("teamCategoryId") REFERENCES "TeamRatingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamFeedbackRating" ADD CONSTRAINT "TeamFeedbackRating_teamFeedbackId_fkey" FOREIGN KEY ("teamFeedbackId") REFERENCES "TeamPerformanceFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceFeedback" ADD CONSTRAINT "TeamPerformanceFeedback_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceFeedback" ADD CONSTRAINT "TeamPerformanceFeedback_giverEmployeeId_fkey" FOREIGN KEY ("giverEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceFeedback" ADD CONSTRAINT "TeamPerformanceFeedback_performanceCycleId_fkey" FOREIGN KEY ("performanceCycleId") REFERENCES "PerformanceCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceFeedback" ADD CONSTRAINT "TeamPerformanceFeedback_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceFeedback" ADD CONSTRAINT "TeamPerformanceFeedback_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceFeedbackResponse" ADD CONSTRAINT "TeamPerformanceFeedbackResponse_teamFeedbackId_fkey" FOREIGN KEY ("teamFeedbackId") REFERENCES "TeamPerformanceFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceFeedbackResponse" ADD CONSTRAINT "TeamPerformanceFeedbackResponse_teamQuestionId_fkey" FOREIGN KEY ("teamQuestionId") REFERENCES "TeamPerformanceQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceQuestion" ADD CONSTRAINT "TeamPerformanceQuestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPerformanceQuestion" ADD CONSTRAINT "TeamPerformanceQuestion_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRatingCategory" ADD CONSTRAINT "TeamRatingCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRatingCategory" ADD CONSTRAINT "TeamRatingCategory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
