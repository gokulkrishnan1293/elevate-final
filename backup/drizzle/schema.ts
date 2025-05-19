import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
  text,
  primaryKey,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------- ENUMS (will add as needed) ----------------

// Enums potentially related to Employee via other tables
export const feedbackTypeEnum = pgEnum("feedback_type", [
  "General",
  "Performance",
]);
export const feedbackRequestStatusEnum = pgEnum("feedback_request_status", [
  "Pending",
  "Completed",
  "Declined",
]);
export const performanceContextEnum = pgEnum("performance_context", [
  "Sprint",
  "PI",
  "Overall",
]);
export const eventScopeLevelEnum = pgEnum("event_scope_level", [
  "Organization",
  "ART",
  "Team",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "Planning",
  "NominationsOpen",
  "VotingOpen",
  "Judging",
  "Completed",
  "Cancelled",
]);
export const teamFeedbackStatusEnum = pgEnum("team_feedback_status", [
  "Draft",
  "Submitted",
]);

// ---------------- TABLE DEFINITIONS ----------------

export const employees = pgTable(
  "Employee",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    lanId: varchar("lanId", { length: 255 }).notNull().unique(),
    isContractor: boolean("isContractor").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()), // For auto-update on modification
    cignaManagerId: integer("cignaManagerId"), // Self-referential
    updatedById: integer("updatedById"), // Self-referential
    isUserActive: boolean("isUserActive").default(true).notNull(),
  },
  (table) => {
    return {
      cignaManagerIdIdx: index("Employee_cignaManagerId_idx").on(
        table.cignaManagerId
      ),
      updatedByIdIdx: index("Employee_updatedById_idx").on(table.updatedById),
      // email and lanId uniqueness is handled by .unique() on column definition
      // Drizzle ORM automatically creates indexes for unique constraints.
    };
  }
);

// --- Tables that Employee has a direct FK to (manager, updatedBy) are self-referential ---
// So they are already handled within the employees table itself.

// --- Tables that have FKs TO Employee (these will define the 'many' side of relations) ---
// We'll define these tables and then the relations.

export const organizations = pgTable(
  "Organization",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      createdByIdIdx: index("Organization_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("Organization_updatedById_idx").on(
        table.updatedById
      ),
    };
  }
);

export const arts = pgTable(
  "ART",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    organizationId: integer("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      nameOrgUnique: unique("ART_name_organizationId_unique").on(
        table.name,
        table.organizationId
      ),
      organizationIdIdx: index("ART_organizationId_idx").on(
        table.organizationId
      ),
      createdByIdIdx: index("ART_createdById_idx").on(table.createdById),
      updatedByIdIdx: index("ART_updatedById_idx").on(table.updatedById),
    };
  }
);

export const teams = pgTable(
  "Team",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    artId: integer("artId")
      .notNull()
      .references(() => arts.id, { onDelete: "cascade" }),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      nameArtUnique: unique("Team_name_artId_unique").on(
        table.name,
        table.artId
      ),
      artIdIdx: index("Team_artId_idx").on(table.artId),
      createdByIdIdx: index("Team_createdById_idx").on(table.createdById),
      updatedByIdIdx: index("Team_updatedById_idx").on(table.updatedById),
    };
  }
);

export const referenceEventTypes = pgTable(
  "ReferenceEventType",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      createdByIdIdx: index("ReferenceEventType_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("ReferenceEventType_updatedById_idx").on(
        table.updatedById
      ),
      isActiveIdx: index("ReferenceEventType_isActive_idx").on(table.isActive),
    };
  }
);

export const events = pgTable(
  "Event",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    startDate: timestamp("startDate"),
    endDate: timestamp("endDate"),
    nominationEndDate: timestamp("nominationEndDate"),
    status: eventStatusEnum("status").default("Planning").notNull(),
    scopeLevel: eventScopeLevelEnum("scopeLevel").notNull(),
    isVotingAnonymous: boolean("isVotingAnonymous").default(false).notNull(),
    isNominationAnonymous: boolean("isNominationAnonymous")
      .default(false)
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    eventTypeId: integer("eventTypeId")
      .notNull()
      .references(() => referenceEventTypes.id),
    eventOwnerId: integer("eventOwnerId").notNull(), // FK to Employee
    scopeOrganizationId: integer("scopeOrganizationId").references(
      () => organizations.id,
      { onDelete: "cascade" }
    ),
    scopeArtId: integer("scopeArtId").references(() => arts.id, {
      onDelete: "cascade",
    }),
    scopeTeamId: integer("scopeTeamId").references(() => teams.id, {
      onDelete: "cascade",
    }),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      eventTypeIdIdx: index("Event_eventTypeId_idx").on(table.eventTypeId),
      eventOwnerIdIdx: index("Event_eventOwnerId_idx").on(table.eventOwnerId),
      scopeOrganizationIdIdx: index("Event_scopeOrganizationId_idx").on(
        table.scopeOrganizationId
      ),
      scopeArtIdIdx: index("Event_scopeArtId_idx").on(table.scopeArtId),
      scopeTeamIdIdx: index("Event_scopeTeamId_idx").on(table.scopeTeamId),
      createdByIdIdx: index("Event_createdById_idx").on(table.createdById),
      updatedByIdIdx: index("Event_updatedById_idx").on(table.updatedById),
      statusIdx: index("Event_status_idx").on(table.status),
      scopeLevelIdx: index("Event_scopeLevel_idx").on(table.scopeLevel),
    };
  }
);

export const referenceAwardCategoryNames = pgTable(
  "ReferenceAwardCategoryName",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      createdByIdIdx: index("ReferenceAwardCategoryName_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("ReferenceAwardCategoryName_updatedById_idx").on(
        table.updatedById
      ),
      isActiveIdx: index("ReferenceAwardCategoryName_isActive_idx").on(
        table.isActive
      ),
    };
  }
);

export const awardCategories = pgTable(
  "AwardCategory",
  {
    id: serial("id").primaryKey(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    eventId: integer("eventId")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    categoryNameId: integer("categoryNameId")
      .notNull()
      .references(() => referenceAwardCategoryNames.id),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      eventCategoryUnique: unique(
        "AwardCategory_eventId_categoryNameId_unique"
      ).on(table.eventId, table.categoryNameId),
      eventIdIdx: index("AwardCategory_eventId_idx").on(table.eventId),
      categoryNameIdIdx: index("AwardCategory_categoryNameId_idx").on(
        table.categoryNameId
      ),
      createdByIdIdx: index("AwardCategory_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("AwardCategory_updatedById_idx").on(
        table.updatedById
      ),
    };
  }
);

export const nominations = pgTable(
  "Nomination",
  {
    id: serial("id").primaryKey(),
    nominationDate: timestamp("nominationDate").defaultNow().notNull(),
    justification: text("justification").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    awardCategoryId: integer("awardCategoryId")
      .notNull()
      .references(() => awardCategories.id, { onDelete: "cascade" }),
    nomineeEmployeeId: integer("nomineeEmployeeId").notNull(), // FK to Employee
    nominatorEmployeeId: integer("nominatorEmployeeId").notNull(), // FK to Employee
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      awardCategoryIdIdx: index("Nomination_awardCategoryId_idx").on(
        table.awardCategoryId
      ),
      nomineeEmployeeIdIdx: index("Nomination_nomineeEmployeeId_idx").on(
        table.nomineeEmployeeId
      ),
      nominatorEmployeeIdIdx: index("Nomination_nominatorEmployeeId_idx").on(
        table.nominatorEmployeeId
      ),
      createdByIdIdx: index("Nomination_createdById_idx").on(table.createdById),
      updatedByIdIdx: index("Nomination_updatedById_idx").on(table.updatedById),
    };
  }
);

export const awards = pgTable(
  "Award",
  {
    id: serial("id").primaryKey(),
    awardDate: timestamp("awardDate").notNull(),
    justification: text("justification"),
    awardValue: varchar("awardValue", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    recipientEmployeeId: integer("recipientEmployeeId").notNull(), // FK to Employee
    awardCategoryId: integer("awardCategoryId")
      .notNull()
      .references(() => awardCategories.id, { onDelete: "cascade" }),
    winningNominationId: integer("winningNominationId")
      .unique()
      .references(() => nominations.id), // Can be null if award not from nomination
    nominatorEmployeeId: integer("nominatorEmployeeId"), // FK to Employee
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      recipientEmployeeIdIdx: index("Award_recipientEmployeeId_idx").on(
        table.recipientEmployeeId
      ),
      awardCategoryIdIdx: index("Award_awardCategoryId_idx").on(
        table.awardCategoryId
      ),
      nominatorEmployeeIdIdx: index("Award_nominatorEmployeeId_idx").on(
        table.nominatorEmployeeId
      ),
      createdByIdIdx: index("Award_createdById_idx").on(table.createdById),
      updatedByIdIdx: index("Award_updatedById_idx").on(table.updatedById),
      // winningNominationId uniqueness handled by .unique() on column
    };
  }
);

export const employeeArtLinks = pgTable(
  "EmployeeARTLink",
  {
    employeeId: integer("employeeId")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    artId: integer("artId")
      .notNull()
      .references(() => arts.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 100 }).notNull(), // Assuming a length
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.employeeId, table.artId, table.role] }),
      employeeIdIdx: index("EmployeeARTLink_employeeId_idx").on(
        table.employeeId
      ),
      artIdIdx: index("EmployeeARTLink_artId_idx").on(table.artId),
    };
  }
);

export const employeeAchievements = pgTable(
  "EmployeeAchievement",
  {
    id: serial("id").primaryKey(),
    description: text("description").notNull(),
    achievementDate: timestamp("achievementDate").notNull(),
    dateLogged: timestamp("dateLogged").defaultNow().notNull(),
    category: varchar("category", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    employeeId: integer("employeeId").notNull(), // FK to Employee
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      employeeIdIdx: index("EmployeeAchievement_employeeId_idx").on(
        table.employeeId
      ),
      createdByIdIdx: index("EmployeeAchievement_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("EmployeeAchievement_updatedById_idx").on(
        table.updatedById
      ),
      achievementDateIdx: index("EmployeeAchievement_achievementDate_idx").on(
        table.achievementDate
      ),
    };
  }
);

export const employeeOrgLinks = pgTable(
  "EmployeeOrgLink",
  {
    employeeId: integer("employeeId")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    organizationId: integer("organizationId")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "no action",
        onUpdate: "no action",
      }), // Prisma's map name is for constraint, actual behavior is NoAction
    role: varchar("role", { length: 100 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.employeeId, table.organizationId, table.role],
      }),
      employeeIdIdx: index("EmployeeOrgLink_employeeId_idx").on(
        table.employeeId
      ),
      organizationIdIdx: index("EmployeeOrgLink_organizationId_idx").on(
        table.organizationId
      ),
    };
  }
);

export const employeeTeamLinks = pgTable(
  "EmployeeTeamLink",
  {
    employeeId: integer("employeeId")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    teamId: integer("teamId")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
    isTeamOwner: boolean("isTeamOwner").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.employeeId, table.teamId] }),
      employeeIdIdx: index("EmployeeTeamLink_employeeId_idx").on(
        table.employeeId
      ),
      teamIdIdx: index("EmployeeTeamLink_teamId_idx").on(table.teamId),
    };
  }
);

export const eventJudges = pgTable(
  "EventJudge",
  {
    eventId: integer("eventId")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    judgeEmployeeId: integer("judgeEmployeeId").notNull(), // FK to Employee
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.eventId, table.judgeEmployeeId] }),
      eventIdIdx: index("EventJudge_eventId_idx").on(table.eventId),
      judgeEmployeeIdIdx: index("EventJudge_judgeEmployeeId_idx").on(
        table.judgeEmployeeId
      ),
    };
  }
);

export const performanceCycles = pgTable(
  "PerformanceCycle",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    organizationId: integer("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      nameOrgUnique: unique("PerformanceCycle_name_organizationId_unique").on(
        table.name,
        table.organizationId
      ),
      organizationIdIdx: index("PerformanceCycle_organizationId_idx").on(
        table.organizationId
      ),
      createdByIdIdx: index("PerformanceCycle_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("PerformanceCycle_updatedById_idx").on(
        table.updatedById
      ),
      isActiveIdx: index("PerformanceCycle_isActive_idx").on(table.isActive),
    };
  }
);

export const feedbackRequests = pgTable(
  "FeedbackRequest",
  {
    id: serial("id").primaryKey(),
    requestedFeedbackType: feedbackTypeEnum("requestedFeedbackType").notNull(),
    status: feedbackRequestStatusEnum("status").default("Pending").notNull(),
    dateRequested: timestamp("dateRequested").defaultNow().notNull(),
    performanceContext: performanceContextEnum("performanceContext"),
    message: text("message"),
    dueDate: timestamp("dueDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    requesterEmployeeId: integer("requesterEmployeeId").notNull(), // FK to Employee
    requestedFromEmployeeId: integer("requestedFromEmployeeId").notNull(), // FK to Employee
    requestedForEmployeeId: integer("requestedForEmployeeId").notNull(), // FK to Employee
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      requesterEmployeeIdIdx: index(
        "FeedbackRequest_requesterEmployeeId_idx"
      ).on(table.requesterEmployeeId),
      requestedFromEmployeeIdIdx: index(
        "FeedbackRequest_requestedFromEmployeeId_idx"
      ).on(table.requestedFromEmployeeId),
      requestedForEmployeeIdIdx: index(
        "FeedbackRequest_requestedForEmployeeId_idx"
      ).on(table.requestedForEmployeeId),
      createdByIdIdx: index("FeedbackRequest_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("FeedbackRequest_updatedById_idx").on(
        table.updatedById
      ),
      statusIdx: index("FeedbackRequest_status_idx").on(table.status),
      dueDateIdx: index("FeedbackRequest_dueDate_idx").on(table.dueDate),
    };
  }
);

export const feedbacks = pgTable(
  "Feedback",
  {
    id: serial("id").primaryKey(),
    feedbackType: feedbackTypeEnum("feedbackType").notNull(),
    isManagerOnly: boolean("isManagerOnly").default(false).notNull(),
    dateSubmitted: timestamp("dateSubmitted").defaultNow().notNull(),
    performanceContext: performanceContextEnum("performanceContext"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    giverEmployeeId: integer("giverEmployeeId").notNull(), // FK to Employee
    receiverEmployeeId: integer("receiverEmployeeId").notNull(), // FK to Employee
    performanceCycleId: integer("performanceCycleId").references(
      () => performanceCycles.id
    ),
    feedbackRequestId: integer("feedbackRequestId")
      .unique()
      .references(() => feedbackRequests.id),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      giverEmployeeIdIdx: index("Feedback_giverEmployeeId_idx").on(
        table.giverEmployeeId
      ),
      receiverEmployeeIdIdx: index("Feedback_receiverEmployeeId_idx").on(
        table.receiverEmployeeId
      ),
      performanceCycleIdIdx: index("Feedback_performanceCycleId_idx").on(
        table.performanceCycleId
      ),
      createdByIdIdx: index("Feedback_createdById_idx").on(table.createdById),
      updatedByIdIdx: index("Feedback_updatedById_idx").on(table.updatedById),
      feedbackTypeIdx: index("Feedback_feedbackType_idx").on(
        table.feedbackType
      ),
      isManagerOnlyIdx: index("Feedback_isManagerOnly_idx").on(
        table.isManagerOnly
      ),
      // feedbackRequestId uniqueness handled by .unique() on column
    };
  }
);

export const performanceQuestions = pgTable(
  "PerformanceQuestion",
  {
    id: serial("id").primaryKey(),
    questionText: text("questionText").notNull(),
    category: varchar("category", { length: 255 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      createdByIdIdx: index("PerformanceQuestion_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("PerformanceQuestion_updatedById_idx").on(
        table.updatedById
      ),
      isActiveIdx: index("PerformanceQuestion_isActive_idx").on(table.isActive),
    };
  }
);

export const performanceFeedbackResponses = pgTable(
  "PerformanceFeedbackResponse",
  {
    id: serial("id").primaryKey(),
    employeeResponse: text("employeeResponse"),
    managerResponse: text("managerResponse"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    feedbackId: integer("feedbackId")
      .notNull()
      .references(() => feedbacks.id, { onDelete: "cascade" }),
    questionId: integer("questionId")
      .notNull()
      .references(() => performanceQuestions.id),
    employeeResponderId: integer("employeeResponderId"), // FK to Employee
    managerResponderId: integer("managerResponderId"), // FK to Employee
  },
  (table) => {
    return {
      feedbackQuestionUnique: unique(
        "PerformanceFeedbackResponse_feedbackId_questionId_unique"
      ).on(table.feedbackId, table.questionId),
      feedbackIdIdx: index("PerformanceFeedbackResponse_feedbackId_idx").on(
        table.feedbackId
      ),
      questionIdIdx: index("PerformanceFeedbackResponse_questionId_idx").on(
        table.questionId
      ),
      employeeResponderIdIdx: index(
        "PerformanceFeedbackResponse_employeeResponderId_idx"
      ).on(table.employeeResponderId),
      managerResponderIdIdx: index(
        "PerformanceFeedbackResponse_managerResponderId_idx"
      ).on(table.managerResponderId),
    };
  }
);

export const ratingCategories = pgTable(
  "RatingCategory",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      createdByIdIdx: index("RatingCategory_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("RatingCategory_updatedById_idx").on(
        table.updatedById
      ),
      isActiveIdx: index("RatingCategory_isActive_idx").on(table.isActive),
    };
  }
);

export const teamPerformanceQuestions = pgTable(
  "TeamPerformanceQuestion",
  {
    id: serial("id").primaryKey(),
    questionText: text("questionText").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      createdByIdIdx: index("TeamPerformanceQuestion_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("TeamPerformanceQuestion_updatedById_idx").on(
        table.updatedById
      ),
      isActiveIdx: index("TeamPerformanceQuestion_isActive_idx").on(
        table.isActive
      ),
    };
  }
);

export const teamRatingCategories = pgTable(
  "TeamRatingCategory",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      createdByIdIdx: index("TeamRatingCategory_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("TeamRatingCategory_updatedById_idx").on(
        table.updatedById
      ),
      isActiveIdx: index("TeamRatingCategory_isActive_idx").on(table.isActive),
    };
  }
);

export const teamPerformanceFeedbacks = pgTable(
  "TeamPerformanceFeedback",
  {
    id: serial("id").primaryKey(),
    dateSubmitted: timestamp("dateSubmitted").defaultNow().notNull(),
    status: teamFeedbackStatusEnum("status").default("Draft").notNull(),
    overallComments: text("overallComments"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    teamId: integer("teamId")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    performanceCycleId: integer("performanceCycleId")
      .notNull()
      .references(() => performanceCycles.id, { onDelete: "cascade" }),
    giverEmployeeId: integer("giverEmployeeId").notNull(), // FK to Employee
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      teamCycleGiverUnique: unique(
        "TeamPerformanceFeedback_team_cycle_giver_unique"
      ).on(table.teamId, table.performanceCycleId, table.giverEmployeeId),
      teamIdIdx: index("TeamPerformanceFeedback_teamId_idx").on(table.teamId),
      performanceCycleIdIdx: index(
        "TeamPerformanceFeedback_performanceCycleId_idx"
      ).on(table.performanceCycleId),
      giverEmployeeIdIdx: index(
        "TeamPerformanceFeedback_giverEmployeeId_idx"
      ).on(table.giverEmployeeId),
      createdByIdIdx: index("TeamPerformanceFeedback_createdById_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("TeamPerformanceFeedback_updatedById_idx").on(
        table.updatedById
      ),
      statusIdx: index("TeamPerformanceFeedback_status_idx").on(table.status),
    };
  }
);

export const votes = pgTable(
  "Vote",
  {
    id: serial("id").primaryKey(),
    voteDate: timestamp("voteDate").defaultNow().notNull(),
    justification: text("justification").notNull(),
    credits: integer("credits").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .notNull()
      .$onUpdate(() => new Date()),
    nominationId: integer("nominationId")
      .notNull()
      .references(() => nominations.id, { onDelete: "cascade" }),
    voterEmployeeId: integer("voterEmployeeId").notNull(), // FK to Employee
    createdById: integer("createdById"), // FK to Employee
    updatedById: integer("updatedById"), // FK to Employee
  },
  (table) => {
    return {
      nominationVoterUnique: unique(
        "Vote_nominationId_voterEmployeeId_unique"
      ).on(table.nominationId, table.voterEmployeeId),
      nominationIdIdx: index("Vote_nominationId_idx").on(table.nominationId),
      voterEmployeeIdIdx: index("Vote_voterEmployeeId_idx").on(
        table.voterEmployeeId
      ),
      createdByIdIdx: index("Vote_createdById_idx").on(table.createdById),
      updatedByIdIdx: index("Vote_updatedById_idx").on(table.updatedById),
    };
  }
);

// ---------------- RELATIONS ----------------

export const employeesRelations = relations(employees, ({ one, many }) => ({
  // Self-referential for manager
  manager: one(employees, {
    fields: [employees.cignaManagerId],
    references: [employees.id],
    relationName: "Employee_cignaManagerIdToEmployee", // For clarity if needed for direct reports
  }),
  directReports: many(employees, {
    relationName: "Employee_cignaManagerIdToEmployee", // Matches the 'one' side
  }),
  // Self-referential for updatedBy
  updatedByEmployee: one(employees, {
    // Renamed to avoid conflict with field name
    fields: [employees.updatedById],
    references: [employees.id],
    relationName: "Employee_updatedByIdToEmployee", // For clarity
  }),
  employeesThisUserUpdated: many(employees, {
    // Renamed to avoid conflict
    relationName: "Employee_updatedByIdToEmployee",
  }),

  // Relations from Employee to other tables (where Employee is on the 'one' side of a many-to-one)
  // These are typically implied by FKs in other tables pointing to Employee.
  // We define the 'many' side here for convenience.

  artsCreated: many(arts, { relationName: "ART_createdByIdToEmployee" }),
  artsUpdated: many(arts, { relationName: "ART_updatedByIdToEmployee" }),

  awardsCreated: many(awards, { relationName: "Award_createdByIdToEmployee" }),
  awardsNominatedBy: many(awards, {
    relationName: "Award_nominatorEmployeeIdToEmployee",
  }),
  awardsReceived: many(awards, {
    relationName: "Award_recipientEmployeeIdToEmployee",
  }),
  awardsUpdated: many(awards, { relationName: "Award_updatedByIdToEmployee" }),

  awardCategoriesCreated: many(awardCategories, {
    relationName: "AwardCategory_createdByIdToEmployee",
  }),
  awardCategoriesUpdated: many(awardCategories, {
    relationName: "AwardCategory_updatedByIdToEmployee",
  }),

  employeeArtLinks: many(employeeArtLinks), // Junction table

  employeeAchievementsCreated: many(employeeAchievements, {
    relationName: "EmployeeAchievement_createdByIdToEmployee",
  }),
  employeeAchievementsFor: many(employeeAchievements, {
    relationName: "EmployeeAchievement_employeeIdToEmployee",
  }),
  employeeAchievementsUpdated: many(employeeAchievements, {
    relationName: "EmployeeAchievement_updatedByIdToEmployee",
  }),

  employeeOrgLinks: many(employeeOrgLinks), // Junction table
  employeeTeamLinks: many(employeeTeamLinks), // Junction table

  eventsCreated: many(events, { relationName: "Event_createdByIdToEmployee" }),
  eventsOwned: many(events, { relationName: "Event_eventOwnerIdToEmployee" }),
  eventsUpdated: many(events, { relationName: "Event_updatedByIdToEmployee" }),

  eventJudges: many(eventJudges), // Junction table

  feedbacksCreated: many(feedbacks, {
    relationName: "Feedback_createdByIdToEmployee",
  }),
  feedbacksGiven: many(feedbacks, {
    relationName: "Feedback_giverEmployeeIdToEmployee",
  }),
  feedbacksReceived: many(feedbacks, {
    relationName: "Feedback_receiverEmployeeIdToEmployee",
  }),
  feedbacksUpdated: many(feedbacks, {
    relationName: "Feedback_updatedByIdToEmployee",
  }),

  feedbackRequestsCreated: many(feedbackRequests, {
    relationName: "FeedbackRequest_createdByIdToEmployee",
  }),
  feedbackRequestsForEmployee: many(feedbackRequests, {
    relationName: "FeedbackRequest_requestedForEmployeeIdToEmployee",
  }),
  feedbackRequestsFromEmployee: many(feedbackRequests, {
    relationName: "FeedbackRequest_requestedFromEmployeeIdToEmployee",
  }),
  feedbackRequestsByRequester: many(feedbackRequests, {
    relationName: "FeedbackRequest_requesterEmployeeIdToEmployee",
  }),
  feedbackRequestsUpdated: many(feedbackRequests, {
    relationName: "FeedbackRequest_updatedByIdToEmployee",
  }),

  nominationsCreated: many(nominations, {
    relationName: "Nomination_createdByIdToEmployee",
  }),
  nominationsMade: many(nominations, {
    relationName: "Nomination_nominatorEmployeeIdToEmployee",
  }),
  nominationsFor: many(nominations, {
    relationName: "Nomination_nomineeEmployeeIdToEmployee",
  }),
  nominationsUpdated: many(nominations, {
    relationName: "Nomination_updatedByIdToEmployee",
  }),

  organizationsCreated: many(organizations, {
    relationName: "Organization_createdByIdToEmployee",
  }),
  organizationsUpdated: many(organizations, {
    relationName: "Organization_updatedByIdToEmployee",
  }),

  performanceCyclesCreated: many(performanceCycles, {
    relationName: "PerformanceCycle_createdByIdToEmployee",
  }),
  performanceCyclesUpdated: many(performanceCycles, {
    relationName: "PerformanceCycle_updatedByIdToEmployee",
  }),

  performanceFeedbackResponsesByEmployee: many(performanceFeedbackResponses, {
    relationName: "PerformanceFeedbackResponse_employeeResponderIdToEmployee",
  }),
  performanceFeedbackResponsesByManager: many(performanceFeedbackResponses, {
    relationName: "PerformanceFeedbackResponse_managerResponderIdToEmployee",
  }),

  performanceQuestionsCreated: many(performanceQuestions, {
    relationName: "PerformanceQuestion_createdByIdToEmployee",
  }),
  performanceQuestionsUpdated: many(performanceQuestions, {
    relationName: "PerformanceQuestion_updatedByIdToEmployee",
  }),

  ratingCategoriesCreated: many(ratingCategories, {
    relationName: "RatingCategory_createdByIdToEmployee",
  }),
  ratingCategoriesUpdated: many(ratingCategories, {
    relationName: "RatingCategory_updatedByIdToEmployee",
  }),

  referenceAwardCategoryNamesCreated: many(referenceAwardCategoryNames, {
    relationName: "ReferenceAwardCategoryName_createdByIdToEmployee",
  }),
  referenceAwardCategoryNamesUpdated: many(referenceAwardCategoryNames, {
    relationName: "ReferenceAwardCategoryName_updatedByIdToEmployee",
  }),

  referenceEventTypesCreated: many(referenceEventTypes, {
    relationName: "ReferenceEventType_createdByIdToEmployee",
  }),
  referenceEventTypesUpdated: many(referenceEventTypes, {
    relationName: "ReferenceEventType_updatedByIdToEmployee",
  }),

  teamsCreated: many(teams, { relationName: "Team_createdByIdToEmployee" }),
  teamsUpdated: many(teams, { relationName: "Team_updatedByIdToEmployee" }),

  teamPerformanceFeedbacksCreated: many(teamPerformanceFeedbacks, {
    relationName: "TeamPerformanceFeedback_createdByIdToEmployee",
  }),
  teamPerformanceFeedbacksGiven: many(teamPerformanceFeedbacks, {
    relationName: "TeamPerformanceFeedback_giverEmployeeIdToEmployee",
  }),
  teamPerformanceFeedbacksUpdated: many(teamPerformanceFeedbacks, {
    relationName: "TeamPerformanceFeedback_updatedByIdToEmployee",
  }),

  teamPerformanceQuestionsCreated: many(teamPerformanceQuestions, {
    relationName: "TeamPerformanceQuestion_createdByIdToEmployee",
  }),
  teamPerformanceQuestionsUpdated: many(teamPerformanceQuestions, {
    relationName: "TeamPerformanceQuestion_updatedByIdToEmployee",
  }),

  teamRatingCategoriesCreated: many(teamRatingCategories, {
    relationName: "TeamRatingCategory_createdByIdToEmployee",
  }),
  teamRatingCategoriesUpdated: many(teamRatingCategories, {
    relationName: "TeamRatingCategory_updatedByIdToEmployee",
  }),

  votesCreated: many(votes, { relationName: "Vote_createdByIdToEmployee" }),
  votesUpdated: many(votes, { relationName: "Vote_updatedByIdToEmployee" }),
  votesMade: many(votes, { relationName: "Vote_voterEmployeeIdToEmployee" }),
}));

// ---- Relations for other tables ----

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [organizations.createdById],
      references: [employees.id],
      relationName: "Organization_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [organizations.updatedById],
      references: [employees.id],
      relationName: "Organization_updatedByIdToEmployee",
    }),
    arts: many(arts),
    employeeOrgLinks: many(employeeOrgLinks),
    events: many(events),
    performanceCycles: many(performanceCycles),
  })
);

export const artsRelations = relations(arts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [arts.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(employees, {
    fields: [arts.createdById],
    references: [employees.id],
    relationName: "ART_createdByIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [arts.updatedById],
    references: [employees.id],
    relationName: "ART_updatedByIdToEmployee",
  }),
  employeeArtLinks: many(employeeArtLinks),
  events: many(events), // For scopeArtId
  teams: many(teams),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  art: one(arts, {
    fields: [teams.artId],
    references: [arts.id],
  }),
  createdBy: one(employees, {
    fields: [teams.createdById],
    references: [employees.id],
    relationName: "Team_createdByIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [teams.updatedById],
    references: [employees.id],
    relationName: "Team_updatedByIdToEmployee",
  }),
  employeeTeamLinks: many(employeeTeamLinks),
  events: many(events), // For scopeTeamId
  teamPerformanceFeedbacks: many(teamPerformanceFeedbacks),
}));

export const referenceEventTypesRelations = relations(
  referenceEventTypes,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [referenceEventTypes.createdById],
      references: [employees.id],
      relationName: "ReferenceEventType_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [referenceEventTypes.updatedById],
      references: [employees.id],
      relationName: "ReferenceEventType_updatedByIdToEmployee",
    }),
    events: many(events),
  })
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  referenceEventType: one(referenceEventTypes, {
    fields: [events.eventTypeId],
    references: [referenceEventTypes.id],
  }),
  eventOwner: one(employees, {
    fields: [events.eventOwnerId],
    references: [employees.id],
    relationName: "Event_eventOwnerIdToEmployee",
  }),
  scopeOrganization: one(organizations, {
    fields: [events.scopeOrganizationId],
    references: [organizations.id],
  }),
  scopeArt: one(arts, {
    fields: [events.scopeArtId],
    references: [arts.id],
  }),
  scopeTeam: one(teams, {
    fields: [events.scopeTeamId],
    references: [teams.id],
  }),
  createdBy: one(employees, {
    fields: [events.createdById],
    references: [employees.id],
    relationName: "Event_createdByIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [events.updatedById],
    references: [employees.id],
    relationName: "Event_updatedByIdToEmployee",
  }),
  awardCategories: many(awardCategories),
  eventJudges: many(eventJudges),
}));

export const referenceAwardCategoryNamesRelations = relations(
  referenceAwardCategoryNames,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [referenceAwardCategoryNames.createdById],
      references: [employees.id],
      relationName: "ReferenceAwardCategoryName_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [referenceAwardCategoryNames.updatedById],
      references: [employees.id],
      relationName: "ReferenceAwardCategoryName_updatedByIdToEmployee",
    }),
    awardCategories: many(awardCategories),
  })
);

export const awardCategoriesRelations = relations(
  awardCategories,
  ({ one, many }) => ({
    event: one(events, {
      fields: [awardCategories.eventId],
      references: [events.id],
    }),
    referenceAwardCategoryName: one(referenceAwardCategoryNames, {
      fields: [awardCategories.categoryNameId],
      references: [referenceAwardCategoryNames.id],
    }),
    createdBy: one(employees, {
      fields: [awardCategories.createdById],
      references: [employees.id],
      relationName: "AwardCategory_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [awardCategories.updatedById],
      references: [employees.id],
      relationName: "AwardCategory_updatedByIdToEmployee",
    }),
    awards: many(awards),
    nominations: many(nominations),
  })
);

export const nominationsRelations = relations(nominations, ({ one, many }) => ({
  awardCategory: one(awardCategories, {
    fields: [nominations.awardCategoryId],
    references: [awardCategories.id],
  }),
  nomineeEmployee: one(employees, {
    fields: [nominations.nomineeEmployeeId],
    references: [employees.id],
    relationName: "Nomination_nomineeEmployeeIdToEmployee",
  }),
  nominatorEmployee: one(employees, {
    fields: [nominations.nominatorEmployeeId],
    references: [employees.id],
    relationName: "Nomination_nominatorEmployeeIdToEmployee",
  }),
  createdBy: one(employees, {
    fields: [nominations.createdById],
    references: [employees.id],
    relationName: "Nomination_createdByIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [nominations.updatedById],
    references: [employees.id],
    relationName: "Nomination_updatedByIdToEmployee",
  }),
  winningAward: one(awards, {
    // This is for Nomination? -> Award
    fields: [nominations.id],
    references: [awards.winningNominationId],
  }),
  votes: many(votes),
}));

export const awardsRelations = relations(awards, ({ one }) => ({
  recipientEmployee: one(employees, {
    fields: [awards.recipientEmployeeId],
    references: [employees.id],
    relationName: "Award_recipientEmployeeIdToEmployee",
  }),
  awardCategory: one(awardCategories, {
    fields: [awards.awardCategoryId],
    references: [awardCategories.id],
  }),
  winningNomination: one(nominations, {
    fields: [awards.winningNominationId],
    references: [nominations.id],
  }),
  nominatorEmployee: one(employees, {
    fields: [awards.nominatorEmployeeId],
    references: [employees.id],
    relationName: "Award_nominatorEmployeeIdToEmployee",
  }),
  createdBy: one(employees, {
    fields: [awards.createdById],
    references: [employees.id],
    relationName: "Award_createdByIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [awards.updatedById],
    references: [employees.id],
    relationName: "Award_updatedByIdToEmployee",
  }),
}));

export const employeeArtLinksRelations = relations(
  employeeArtLinks,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeArtLinks.employeeId],
      references: [employees.id],
    }),
    art: one(arts, {
      fields: [employeeArtLinks.artId],
      references: [arts.id],
    }),
  })
);

export const employeeAchievementsRelations = relations(
  employeeAchievements,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeAchievements.employeeId],
      references: [employees.id],
      relationName: "EmployeeAchievement_employeeIdToEmployee",
    }),
    createdBy: one(employees, {
      fields: [employeeAchievements.createdById],
      references: [employees.id],
      relationName: "EmployeeAchievement_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [employeeAchievements.updatedById],
      references: [employees.id],
      relationName: "EmployeeAchievement_updatedByIdToEmployee",
    }),
  })
);

export const employeeOrgLinksRelations = relations(
  employeeOrgLinks,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeOrgLinks.employeeId],
      references: [employees.id],
    }),
    organization: one(organizations, {
      fields: [employeeOrgLinks.organizationId],
      references: [organizations.id],
    }),
  })
);

export const employeeTeamLinksRelations = relations(
  employeeTeamLinks,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeTeamLinks.employeeId],
      references: [employees.id],
    }),
    team: one(teams, {
      fields: [employeeTeamLinks.teamId],
      references: [teams.id],
    }),
  })
);

export const eventJudgesRelations = relations(eventJudges, ({ one }) => ({
  event: one(events, {
    fields: [eventJudges.eventId],
    references: [events.id],
  }),
  judgeEmployee: one(employees, {
    fields: [eventJudges.judgeEmployeeId],
    references: [employees.id],
    // No explicit relation name in Prisma, Drizzle will infer one
  }),
}));

export const performanceCyclesRelations = relations(
  performanceCycles,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [performanceCycles.organizationId],
      references: [organizations.id],
    }),
    createdBy: one(employees, {
      fields: [performanceCycles.createdById],
      references: [employees.id],
      relationName: "PerformanceCycle_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [performanceCycles.updatedById],
      references: [employees.id],
      relationName: "PerformanceCycle_updatedByIdToEmployee",
    }),
    feedbacks: many(feedbacks),
    teamPerformanceFeedbacks: many(teamPerformanceFeedbacks),
  })
);

export const feedbackRequestsRelations = relations(
  feedbackRequests,
  ({ one }) => ({
    requesterEmployee: one(employees, {
      fields: [feedbackRequests.requesterEmployeeId],
      references: [employees.id],
      relationName: "FeedbackRequest_requesterEmployeeIdToEmployee",
    }),
    requestedFromEmployee: one(employees, {
      fields: [feedbackRequests.requestedFromEmployeeId],
      references: [employees.id],
      relationName: "FeedbackRequest_requestedFromEmployeeIdToEmployee",
    }),
    requestedForEmployee: one(employees, {
      fields: [feedbackRequests.requestedForEmployeeId],
      references: [employees.id],
      relationName: "FeedbackRequest_requestedForEmployeeIdToEmployee",
    }),
    createdBy: one(employees, {
      fields: [feedbackRequests.createdById],
      references: [employees.id],
      relationName: "FeedbackRequest_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [feedbackRequests.updatedById],
      references: [employees.id],
      relationName: "FeedbackRequest_updatedByIdToEmployee",
    }),
    feedback: one(feedbacks, {
      // For FeedbackRequest? -> Feedback
      fields: [feedbackRequests.id],
      references: [feedbacks.feedbackRequestId],
    }),
  })
);

export const feedbacksRelations = relations(feedbacks, ({ one, many }) => ({
  giverEmployee: one(employees, {
    fields: [feedbacks.giverEmployeeId],
    references: [employees.id],
    relationName: "Feedback_giverEmployeeIdToEmployee",
  }),
  receiverEmployee: one(employees, {
    fields: [feedbacks.receiverEmployeeId],
    references: [employees.id],
    relationName: "Feedback_receiverEmployeeIdToEmployee",
  }),
  performanceCycle: one(performanceCycles, {
    fields: [feedbacks.performanceCycleId],
    references: [performanceCycles.id],
  }),
  feedbackRequest: one(feedbackRequests, {
    // For Feedback? -> FeedbackRequest
    fields: [feedbacks.feedbackRequestId],
    references: [feedbackRequests.id],
  }),
  createdBy: one(employees, {
    fields: [feedbacks.createdById],
    references: [employees.id],
    relationName: "Feedback_createdByIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [feedbacks.updatedById],
    references: [employees.id],
    relationName: "Feedback_updatedByIdToEmployee",
  }),
  // feedbackGeneralQAs: many(feedbackGeneralQAs), // Need to define table
  // feedbackRatings: many(feedbackRatings), // Need to define table
  performanceFeedbackResponses: many(performanceFeedbackResponses),
}));

export const performanceQuestionsRelations = relations(
  performanceQuestions,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [performanceQuestions.createdById],
      references: [employees.id],
      relationName: "PerformanceQuestion_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [performanceQuestions.updatedById],
      references: [employees.id],
      relationName: "PerformanceQuestion_updatedByIdToEmployee",
    }),
    performanceFeedbackResponses: many(performanceFeedbackResponses),
  })
);

export const performanceFeedbackResponsesRelations = relations(
  performanceFeedbackResponses,
  ({ one }) => ({
    feedback: one(feedbacks, {
      fields: [performanceFeedbackResponses.feedbackId],
      references: [feedbacks.id],
    }),
    performanceQuestion: one(performanceQuestions, {
      fields: [performanceFeedbackResponses.questionId],
      references: [performanceQuestions.id],
    }),
    employeeResponder: one(employees, {
      fields: [performanceFeedbackResponses.employeeResponderId],
      references: [employees.id],
      relationName: "PerformanceFeedbackResponse_employeeResponderIdToEmployee",
    }),
    managerResponder: one(employees, {
      fields: [performanceFeedbackResponses.managerResponderId],
      references: [employees.id],
      relationName: "PerformanceFeedbackResponse_managerResponderIdToEmployee",
    }),
  })
);

export const ratingCategoriesRelations = relations(
  ratingCategories,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [ratingCategories.createdById],
      references: [employees.id],
      relationName: "RatingCategory_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [ratingCategories.updatedById],
      references: [employees.id],
      relationName: "RatingCategory_updatedByIdToEmployee",
    }),
    // feedbackRatings: many(feedbackRatings), // Need to define table
  })
);

export const teamPerformanceQuestionsRelations = relations(
  teamPerformanceQuestions,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [teamPerformanceQuestions.createdById],
      references: [employees.id],
      relationName: "TeamPerformanceQuestion_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [teamPerformanceQuestions.updatedById],
      references: [employees.id],
      relationName: "TeamPerformanceQuestion_updatedByIdToEmployee",
    }),
    // teamPerformanceFeedbackResponses: many(teamPerformanceFeedbackResponses), // Need to define table
  })
);

export const teamRatingCategoriesRelations = relations(
  teamRatingCategories,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [teamRatingCategories.createdById],
      references: [employees.id],
      relationName: "TeamRatingCategory_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [teamRatingCategories.updatedById],
      references: [employees.id],
      relationName: "TeamRatingCategory_updatedByIdToEmployee",
    }),
    // teamFeedbackRatings: many(teamFeedbackRatings), // Need to define table
  })
);

export const teamPerformanceFeedbacksRelations = relations(
  teamPerformanceFeedbacks,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [teamPerformanceFeedbacks.teamId],
      references: [teams.id],
    }),
    performanceCycle: one(performanceCycles, {
      fields: [teamPerformanceFeedbacks.performanceCycleId],
      references: [performanceCycles.id],
    }),
    giverEmployee: one(employees, {
      fields: [teamPerformanceFeedbacks.giverEmployeeId],
      references: [employees.id],
      relationName: "TeamPerformanceFeedback_giverEmployeeIdToEmployee",
    }),
    createdBy: one(employees, {
      fields: [teamPerformanceFeedbacks.createdById],
      references: [employees.id],
      relationName: "TeamPerformanceFeedback_createdByIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [teamPerformanceFeedbacks.updatedById],
      references: [employees.id],
      relationName: "TeamPerformanceFeedback_updatedByIdToEmployee",
    }),
    // teamFeedbackRatings: many(teamFeedbackRatings), // Need to define table
    // teamPerformanceFeedbackResponses: many(teamPerformanceFeedbackResponses), // Need to define table
  })
);

export const votesRelations = relations(votes, ({ one }) => ({
  nomination: one(nominations, {
    fields: [votes.nominationId],
    references: [nominations.id],
  }),
  voterEmployee: one(employees, {
    fields: [votes.voterEmployeeId],
    references: [employees.id],
    relationName: "Vote_voterEmployeeIdToEmployee",
  }),
  createdBy: one(employees, {
    fields: [votes.createdById],
    references: [employees.id],
    relationName: "Vote_createdByIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [votes.updatedById],
    references: [employees.id],
    relationName: "Vote_updatedByIdToEmployee",
  }),
}));

// Note: FeedbackGeneralQA, FeedbackRating, TeamFeedbackRating, TeamPerformanceFeedbackResponse
// still need to be defined and their relations set up if you need the full schema.
// I've focused on Employee and the tables directly linked via FKs in the Prisma definition of Employee,
// or tables that Employee links to, and then recursively for those tables.
// The `relationName` in Drizzle is crucial for matching bi-directional relations when Prisma has explicit `@relation` names.
// If Prisma doesn't have an explicit relation name for a one-to-many, Drizzle can usually infer it,
// but for many-to-many or explicitly named relations, `relationName` is important.
