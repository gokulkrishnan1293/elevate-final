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

// ---------------- ENUMS (DB type names are already snake_case) ----------------

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
  "employee",
  {
    // Columns (camelCase for TS, snake_case string for DB)
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    lanId: varchar("lan_id", { length: 255 }).notNull().unique(),
    isContractor: boolean("is_contractor").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    cignaManagerId: integer("cigna_manager_id"), // Self-referential FK
    updatedById: integer("updated_by_id"), // Self-referential FK
    isUserActive: boolean("is_user_active").default(true).notNull(),
  },
  (table) => {
    // Indexes and constraints (DB names are snake_case)
    return {
      cignaManagerIdIdx: index("employee_cigna_manager_id_idx").on(
        table.cignaManagerId
      ), // TS uses camelCase here
      emailIdx: index("employee_email_idx").on(table.email), // Drizzle/Kit might auto-create for unique
      lanIdIdx: index("employee_lan_id_idx").on(table.lanId), // Drizzle/Kit might auto-create for unique
      updatedByIdIdx: index("employee_updated_by_id_idx").on(table.updatedById),
    };
  }
);

export const organizations = pgTable(
  "organization",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"), // FK to Employee
    updatedById: integer("updated_by_id"), // FK to Employee
  },
  (table) => {
    return {
      createdByIdIdx: index("organization_created_by_id_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("organization_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const arts = pgTable(
  "art",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdById: integer("created_by_id"), // FK to Employee
    updatedById: integer("updated_by_id"), // FK to Employee
  },
  (table) => {
    return {
      nameOrgUnique: unique("art_name_organization_id_unique").on(
        table.name,
        table.organizationId
      ),
      organizationIdIdx: index("art_organization_id_idx").on(
        table.organizationId
      ),
      createdByIdIdx: index("art_created_by_id_idx").on(table.createdById),
      updatedByIdIdx: index("art_updated_by_id_idx").on(table.updatedById),
    };
  }
);

export const referenceAwardCategoryNames = pgTable(
  "reference_award_category_name",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      createdByIdIdx: index("ref_award_cat_name_created_by_id_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("ref_award_cat_name_updated_by_id_idx").on(
        table.updatedById
      ),
      isActiveIdx: index("ref_award_cat_name_is_active_idx").on(table.isActive),
    };
  }
);

export const referenceEventTypes = pgTable(
  "reference_event_type",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      createdByIdIdx: index("ref_event_type_created_by_id_idx").on(
        table.createdById
      ),
      updatedByIdIdx: index("ref_event_type_updated_by_id_idx").on(
        table.updatedById
      ),
      isActiveIdx: index("ref_event_type_is_active_idx").on(table.isActive),
    };
  }
);

export const teams = pgTable(
  "team",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    artId: integer("art_id")
      .notNull()
      .references(() => arts.id, { onDelete: "cascade" }),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      nameArtIdUnique: unique("team_name_art_id_unique").on(
        table.name,
        table.artId
      ),
      artIdIdx: index("team_art_id_idx").on(table.artId),
      createdByIdIdx: index("team_created_by_id_idx").on(table.createdById),
      updatedByIdIdx: index("team_updated_by_id_idx").on(table.updatedById),
    };
  }
);

export const events = pgTable(
  "event",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    nominationEndDate: timestamp("nomination_end_date"),
    status: eventStatusEnum("status").default("Planning").notNull(),
    scopeLevel: eventScopeLevelEnum("scope_level").notNull(),
    isVotingAnonymous: boolean("is_voting_anonymous").default(false).notNull(),
    isNominationAnonymous: boolean("is_nomination_anonymous")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    eventTypeId: integer("event_type_id")
      .notNull()
      .references(() => referenceEventTypes.id),
    eventOwnerId: integer("event_owner_id").notNull(), // FK to Employee
    scopeOrganizationId: integer("scope_organization_id").references(
      () => organizations.id,
      { onDelete: "cascade" }
    ),
    scopeArtId: integer("scope_art_id").references(() => arts.id, {
      onDelete: "cascade",
    }),
    scopeTeamId: integer("scope_team_id").references(() => teams.id, {
      onDelete: "cascade",
    }),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      createdByIdIdx: index("event_created_by_id_idx").on(table.createdById),
      eventOwnerIdIdx: index("event_event_owner_id_idx").on(table.eventOwnerId),
      eventTypeIdIdx: index("event_event_type_id_idx").on(table.eventTypeId),
      scopeArtIdIdx: index("event_scope_art_id_idx").on(table.scopeArtId),
      scopeLevelIdx: index("event_scope_level_idx").on(table.scopeLevel),
      scopeOrganizationIdIdx: index("event_scope_organization_id_idx").on(
        table.scopeOrganizationId
      ),
      scopeTeamIdIdx: index("event_scope_team_id_idx").on(table.scopeTeamId),
      statusIdx: index("event_status_idx").on(table.status),
      updatedByIdIdx: index("event_updated_by_id_idx").on(table.updatedById),
    };
  }
);

export const awardCategories = pgTable(
  "award_category",
  {
    id: serial("id").primaryKey(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    categoryNameId: integer("category_name_id")
      .notNull()
      .references(() => referenceAwardCategoryNames.id),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      eventIdCategoryNameIdUnique: unique(
        "award_category_event_id_category_name_id_unique"
      ).on(table.eventId, table.categoryNameId),
      categoryNameIdIdx: index("award_category_category_name_id_idx").on(
        table.categoryNameId
      ),
      createdByIdIdx: index("award_category_created_by_id_idx").on(
        table.createdById
      ),
      eventIdIdx: index("award_category_event_id_idx").on(table.eventId),
      updatedByIdIdx: index("award_category_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const nominations = pgTable(
  "nomination",
  {
    id: serial("id").primaryKey(),
    nominationDate: timestamp("nomination_date").defaultNow().notNull(),
    justification: text("justification").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    awardCategoryId: integer("award_category_id")
      .notNull()
      .references(() => awardCategories.id, { onDelete: "cascade" }),
    nomineeEmployeeId: integer("nominee_employee_id").notNull(), // FK to Employee
    nominatorEmployeeId: integer("nominator_employee_id").notNull(), // FK to Employee
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      awardCategoryIdIdx: index("nomination_award_category_id_idx").on(
        table.awardCategoryId
      ),
      createdByIdIdx: index("nomination_created_by_id_idx").on(
        table.createdById
      ),
      nominatorEmployeeIdIdx: index("nomination_nominator_employee_id_idx").on(
        table.nominatorEmployeeId
      ),
      nomineeEmployeeIdIdx: index("nomination_nominee_employee_id_idx").on(
        table.nomineeEmployeeId
      ),
      updatedByIdIdx: index("nomination_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const awards = pgTable(
  "award",
  {
    id: serial("id").primaryKey(),
    awardDate: timestamp("award_date").notNull(),
    justification: text("justification"),
    awardValue: varchar("award_value", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    recipientEmployeeId: integer("recipient_employee_id").notNull(), // FK to Employee
    awardCategoryId: integer("award_category_id")
      .notNull()
      .references(() => awardCategories.id, { onDelete: "cascade" }),
    winningNominationId: integer("winning_nomination_id")
      .unique()
      .references(() => nominations.id, { onDelete: "set null" }), // Prisma default is set null for optional relations
    nominatorEmployeeId: integer("nominator_employee_id"), // FK to Employee
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      awardCategoryIdIdx: index("award_award_category_id_idx").on(
        table.awardCategoryId
      ),
      createdByIdIdx: index("award_created_by_id_idx").on(table.createdById),
      nominatorEmployeeIdIdx: index("award_nominator_employee_id_idx").on(
        table.nominatorEmployeeId
      ),
      recipientEmployeeIdIdx: index("award_recipient_employee_id_idx").on(
        table.recipientEmployeeId
      ),
      updatedByIdIdx: index("award_updated_by_id_idx").on(table.updatedById),
      // winningNominationId is unique via column def
    };
  }
);

export const employeeArtLinks = pgTable(
  "employee_art_link",
  {
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    artId: integer("art_id")
      .notNull()
      .references(() => arts.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.employeeId, table.artId, table.role],
        name: "employee_art_link_pkey",
      }),
      artIdIdx: index("employee_art_link_art_id_idx").on(table.artId),
      employeeIdIdx: index("employee_art_link_employee_id_idx").on(
        table.employeeId
      ),
    };
  }
);

export const employeeAchievements = pgTable(
  "employee_achievement",
  {
    id: serial("id").primaryKey(),
    description: text("description").notNull(),
    achievementDate: timestamp("achievement_date").notNull(),
    dateLogged: timestamp("date_logged").defaultNow().notNull(),
    category: varchar("category", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    employeeId: integer("employee_id").notNull(), // FK to Employee
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      achievementDateIdx: index("employee_achievement_achievement_date_idx").on(
        table.achievementDate
      ),
      createdByIdIdx: index("employee_achievement_created_by_id_idx").on(
        table.createdById
      ),
      employeeIdIdx: index("employee_achievement_employee_id_idx").on(
        table.employeeId
      ),
      updatedByIdIdx: index("employee_achievement_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const employeeOrgLinks = pgTable(
  "employee_org_link",
  {
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "no action",
        onUpdate: "no action",
      }),
    role: varchar("role", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.employeeId, table.organizationId, table.role],
        name: "employee_org_link_pkey",
      }),
      employeeIdIdx: index("employee_org_link_employee_id_idx").on(
        table.employeeId
      ),
      organizationIdIdx: index("employee_org_link_organization_id_idx").on(
        table.organizationId
      ),
    };
  }
);

export const employeeTeamLinks = pgTable(
  "employee_team_link",
  {
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    jobTitle: varchar("job_title", { length: 255 }).notNull(),
    isTeamOwner: boolean("is_team_owner").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.employeeId, table.teamId],
        name: "employee_team_link_pkey",
      }),
      employeeIdIdx: index("employee_team_link_employee_id_idx").on(
        table.employeeId
      ),
      teamIdIdx: index("employee_team_link_team_id_idx").on(table.teamId),
    };
  }
);

export const eventJudges = pgTable(
  "event_judge",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    judgeEmployeeId: integer("judge_employee_id").notNull(), // FK to Employee
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.eventId, table.judgeEmployeeId],
        name: "event_judge_pkey",
      }),
      eventIdIdx: index("event_judge_event_id_idx").on(table.eventId),
      judgeEmployeeIdIdx: index("event_judge_judge_employee_id_idx").on(
        table.judgeEmployeeId
      ),
    };
  }
);

export const performanceCycles = pgTable(
  "performance_cycle",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      nameOrganizationIdUnique: unique(
        "performance_cycle_name_organization_id_unique"
      ).on(table.name, table.organizationId),
      createdByIdIdx: index("performance_cycle_created_by_id_idx").on(
        table.createdById
      ),
      isActiveIdx: index("performance_cycle_is_active_idx").on(table.isActive),
      organizationIdIdx: index("performance_cycle_organization_id_idx").on(
        table.organizationId
      ),
      updatedByIdIdx: index("performance_cycle_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const feedbackRequests = pgTable(
  "feedback_request",
  {
    id: serial("id").primaryKey(),
    requestedFeedbackType: feedbackTypeEnum(
      "requested_feedback_type"
    ).notNull(),
    status: feedbackRequestStatusEnum("status").default("Pending").notNull(),
    dateRequested: timestamp("date_requested").defaultNow().notNull(),
    performanceContext: performanceContextEnum("performance_context"),
    message: text("message"),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    requesterEmployeeId: integer("requester_employee_id").notNull(), // FK to Employee
    requestedFromEmployeeId: integer("requested_from_employee_id").notNull(), // FK to Employee
    requestedForEmployeeId: integer("requested_for_employee_id").notNull(), // FK to Employee
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      createdByIdIdx: index("feedback_request_created_by_id_idx").on(
        table.createdById
      ),
      dueDateIdx: index("feedback_request_due_date_idx").on(table.dueDate),
      requestedForEmployeeIdIdx: index(
        "feedback_request_requested_for_employee_id_idx"
      ).on(table.requestedForEmployeeId),
      requestedFromEmployeeIdIdx: index(
        "feedback_request_requested_from_employee_id_idx"
      ).on(table.requestedFromEmployeeId),
      requesterEmployeeIdIdx: index(
        "feedback_request_requester_employee_id_idx"
      ).on(table.requesterEmployeeId),
      statusIdx: index("feedback_request_status_idx").on(table.status),
      updatedByIdIdx: index("feedback_request_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const feedbacks = pgTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    feedbackType: feedbackTypeEnum("feedback_type").notNull(),
    isManagerOnly: boolean("is_manager_only").default(false).notNull(),
    dateSubmitted: timestamp("date_submitted").defaultNow().notNull(),
    performanceContext: performanceContextEnum("performance_context"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    giverEmployeeId: integer("giver_employee_id").notNull(), // FK to Employee
    receiverEmployeeId: integer("receiver_employee_id").notNull(), // FK to Employee
    performanceCycleId: integer("performance_cycle_id").references(
      () => performanceCycles.id,
      { onDelete: "set null" }
    ),
    feedbackRequestId: integer("feedback_request_id")
      .unique()
      .references(() => feedbackRequests.id, { onDelete: "set null" }),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      createdByIdIdx: index("feedback_created_by_id_idx").on(table.createdById),
      feedbackTypeIdx: index("feedback_feedback_type_idx").on(
        table.feedbackType
      ),
      giverEmployeeIdIdx: index("feedback_giver_employee_id_idx").on(
        table.giverEmployeeId
      ),
      isManagerOnlyIdx: index("feedback_is_manager_only_idx").on(
        table.isManagerOnly
      ),
      performanceCycleIdIdx: index("feedback_performance_cycle_id_idx").on(
        table.performanceCycleId
      ),
      receiverEmployeeIdIdx: index("feedback_receiver_employee_id_idx").on(
        table.receiverEmployeeId
      ),
      updatedByIdIdx: index("feedback_updated_by_id_idx").on(table.updatedById),
      // feedbackRequestId is unique via column def
    };
  }
);

export const feedbackGeneralQas = pgTable(
  "feedback_general_qa",
  {
    id: serial("id").primaryKey(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    feedbackId: integer("feedback_id")
      .notNull()
      .references(() => feedbacks.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      feedbackIdIdx: index("feedback_general_qa_feedback_id_idx").on(
        table.feedbackId
      ),
    };
  }
);

export const ratingCategories = pgTable(
  "rating_category",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      createdByIdIdx: index("rating_category_created_by_id_idx").on(
        table.createdById
      ),
      isActiveIdx: index("rating_category_is_active_idx").on(table.isActive),
      updatedByIdIdx: index("rating_category_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const feedbackRatings = pgTable(
  "feedback_rating",
  {
    id: serial("id").primaryKey(),
    ratingValue: integer("rating_value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    feedbackId: integer("feedback_id")
      .notNull()
      .references(() => feedbacks.id, { onDelete: "cascade" }),
    ratingCategoryId: integer("rating_category_id")
      .notNull()
      .references(() => ratingCategories.id, { onDelete: "restrict" }), // Prisma default for required relation
  },
  (table) => {
    return {
      feedbackIdRatingCategoryIdUnique: unique(
        "feedback_rating_feedback_id_rating_category_id_unique"
      ).on(table.feedbackId, table.ratingCategoryId),
      feedbackIdIdx: index("feedback_rating_feedback_id_idx").on(
        table.feedbackId
      ),
      ratingCategoryIdIdx: index("feedback_rating_rating_category_id_idx").on(
        table.ratingCategoryId
      ),
    };
  }
);

export const performanceQuestions = pgTable(
  "performance_question",
  {
    id: serial("id").primaryKey(),
    questionText: text("question_text").notNull(),
    category: varchar("category", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      createdByIdIdx: index("performance_question_created_by_id_idx").on(
        table.createdById
      ),
      isActiveIdx: index("performance_question_is_active_idx").on(
        table.isActive
      ),
      updatedByIdIdx: index("performance_question_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const performanceFeedbackResponses = pgTable(
  "performance_feedback_response",
  {
    id: serial("id").primaryKey(),
    employeeResponse: text("employee_response"),
    managerResponse: text("manager_response"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    feedbackId: integer("feedback_id")
      .notNull()
      .references(() => feedbacks.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => performanceQuestions.id, { onDelete: "restrict" }), // Prisma default for required relation
    employeeResponderId: integer("employee_responder_id"), // FK to Employee
    managerResponderId: integer("manager_responder_id"), // FK to Employee
  },
  (table) => {
    return {
      feedbackIdQuestionIdUnique: unique(
        "perf_fdbk_resp_feedback_id_question_id_unique"
      ).on(table.feedbackId, table.questionId), // Abbreviated
      employeeResponderIdIdx: index(
        "perf_fdbk_resp_employee_responder_id_idx"
      ).on(table.employeeResponderId),
      feedbackIdIdx: index("perf_fdbk_resp_feedback_id_idx").on(
        table.feedbackId
      ),
      managerResponderIdIdx: index(
        "perf_fdbk_resp_manager_responder_id_idx"
      ).on(table.managerResponderId),
      questionIdIdx: index("perf_fdbk_resp_question_id_idx").on(
        table.questionId
      ),
    };
  }
);

export const teamRatingCategories = pgTable(
  "team_rating_category",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      createdByIdIdx: index("team_rating_category_created_by_id_idx").on(
        table.createdById
      ),
      isActiveIdx: index("team_rating_category_is_active_idx").on(
        table.isActive
      ),
      updatedByIdIdx: index("team_rating_category_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const teamPerformanceFeedbacks = pgTable(
  "team_performance_feedback",
  {
    id: serial("id").primaryKey(),
    dateSubmitted: timestamp("date_submitted").defaultNow().notNull(),
    status: teamFeedbackStatusEnum("status").default("Draft").notNull(),
    overallComments: text("overall_comments"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    performanceCycleId: integer("performance_cycle_id")
      .notNull()
      .references(() => performanceCycles.id, { onDelete: "cascade" }),
    giverEmployeeId: integer("giver_employee_id").notNull(), // FK to Employee
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      teamIdPerfCycleIdGiverEmpIdUnique: unique(
        "team_perf_fdbk_team_id_perf_cycle_id_giver_emp_id_unique"
      ).on(table.teamId, table.performanceCycleId, table.giverEmployeeId), // Abbreviated
      createdByIdIdx: index("team_perf_fdbk_created_by_id_idx").on(
        table.createdById
      ),
      giverEmployeeIdIdx: index("team_perf_fdbk_giver_employee_id_idx").on(
        table.giverEmployeeId
      ),
      performanceCycleIdIdx: index(
        "team_perf_fdbk_performance_cycle_id_idx"
      ).on(table.performanceCycleId),
      statusIdx: index("team_perf_fdbk_status_idx").on(table.status),
      teamIdIdx: index("team_perf_fdbk_team_id_idx").on(table.teamId),
      updatedByIdIdx: index("team_perf_fdbk_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const teamFeedbackRatings = pgTable(
  "team_feedback_rating",
  {
    id: serial("id").primaryKey(),
    ratingValue: integer("rating_value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    teamFeedbackId: integer("team_feedback_id")
      .notNull()
      .references(() => teamPerformanceFeedbacks.id, { onDelete: "cascade" }),
    teamCategoryId: integer("team_category_id")
      .notNull()
      .references(() => teamRatingCategories.id, { onDelete: "restrict" }), // Prisma default for required relation
  },
  (table) => {
    return {
      teamFeedbackIdTeamCategoryIdUnique: unique(
        "team_fdbk_rating_team_fdbk_id_team_cat_id_unique"
      ).on(table.teamFeedbackId, table.teamCategoryId), // Abbreviated
      teamCategoryIdIdx: index("team_fdbk_rating_team_category_id_idx").on(
        table.teamCategoryId
      ),
      teamFeedbackIdIdx: index("team_fdbk_rating_team_feedback_id_idx").on(
        table.teamFeedbackId
      ),
    };
  }
);

export const teamPerformanceQuestions = pgTable(
  "team_performance_question",
  {
    id: serial("id").primaryKey(),
    questionText: text("question_text").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      createdByIdIdx: index("team_perf_question_created_by_id_idx").on(
        table.createdById
      ),
      isActiveIdx: index("team_perf_question_is_active_idx").on(table.isActive),
      updatedByIdIdx: index("team_perf_question_updated_by_id_idx").on(
        table.updatedById
      ),
    };
  }
);

export const teamPerformanceFeedbackResponses = pgTable(
  "team_performance_feedback_response",
  {
    id: serial("id").primaryKey(),
    responseText: text("response_text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    teamFeedbackId: integer("team_feedback_id")
      .notNull()
      .references(() => teamPerformanceFeedbacks.id, { onDelete: "cascade" }),
    teamQuestionId: integer("team_question_id")
      .notNull()
      .references(() => teamPerformanceQuestions.id, { onDelete: "restrict" }), // Prisma default for required relation
  },
  (table) => {
    return {
      teamFeedbackIdTeamQuestionIdUnique: unique(
        "team_perf_fdbk_resp_team_fdbk_id_team_q_id_unique"
      ).on(table.teamFeedbackId, table.teamQuestionId), // Abbreviated
      teamFeedbackIdIdx: index("team_perf_fdbk_resp_team_feedback_id_idx").on(
        table.teamFeedbackId
      ),
      teamQuestionIdIdx: index("team_perf_fdbk_resp_team_question_id_idx").on(
        table.teamQuestionId
      ),
    };
  }
);

export const votes = pgTable(
  "vote",
  {
    id: serial("id").primaryKey(),
    voteDate: timestamp("vote_date").defaultNow().notNull(),
    justification: text("justification").notNull(),
    credits: integer("credits").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    nominationId: integer("nomination_id")
      .notNull()
      .references(() => nominations.id, { onDelete: "cascade" }),
    voterEmployeeId: integer("voter_employee_id").notNull(), // FK to Employee
    createdById: integer("created_by_id"),
    updatedById: integer("updated_by_id"),
  },
  (table) => {
    return {
      nominationIdVoterEmployeeIdUnique: unique(
        "vote_nomination_id_voter_employee_id_unique"
      ).on(table.nominationId, table.voterEmployeeId),
      createdByIdIdx: index("vote_created_by_id_idx").on(table.createdById),
      nominationIdIdx: index("vote_nomination_id_idx").on(table.nominationId),
      updatedByIdIdx: index("vote_updated_by_id_idx").on(table.updatedById),
      voterEmployeeIdIdx: index("vote_voter_employee_id_idx").on(
        table.voterEmployeeId
      ),
    };
  }
);

// ---------------- RELATIONS (camelCase for TS, using Prisma's explicit relation names) ----------------

export const employeesRelations = relations(employees, ({ one, many }) => ({
  manager: one(employees, {
    fields: [employees.cignaManagerId],
    references: [employees.id],
    relationName: "Employee_cignaManagerIdToEmployee",
  }),
  directReports: many(employees, {
    relationName: "Employee_cignaManagerIdToEmployee",
  }),
  updatedByEmployee: one(employees, {
    fields: [employees.updatedById],
    references: [employees.id],
    relationName: "Employee_updatedByIdToEmployee",
  }),
  employeesThisUserUpdated: many(employees, {
    relationName: "Employee_updatedByIdToEmployee",
  }),

  // Relations from Employee to other tables
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
  employeeArtLinks: many(employeeArtLinks),
  employeeAchievementsCreated: many(employeeAchievements, {
    relationName: "EmployeeAchievement_createdByIdToEmployee",
  }),
  achievementsForEmployee: many(employeeAchievements, {
    relationName: "EmployeeAchievement_employeeIdToEmployee",
  }),
  employeeAchievementsUpdated: many(employeeAchievements, {
    relationName: "EmployeeAchievement_updatedByIdToEmployee",
  }),
  employeeOrgLinks: many(employeeOrgLinks),
  employeeTeamLinks: many(employeeTeamLinks),
  eventsCreated: many(events, { relationName: "Event_createdByIdToEmployee" }),
  eventsOwned: many(events, { relationName: "Event_eventOwnerIdToEmployee" }),
  eventsUpdated: many(events, { relationName: "Event_updatedByIdToEmployee" }),
  eventJudgesAsJudge: many(eventJudges),
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
    events: many(events), // For Event.scopeOrganizationId
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
  events: many(events), // For Event.scopeArtId
  teams: many(teams),
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
  events: many(events), // For Event.scopeTeamId
  teamPerformanceFeedbacks: many(teamPerformanceFeedbacks),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  eventOwner: one(employees, {
    fields: [events.eventOwnerId],
    references: [employees.id],
    relationName: "Event_eventOwnerIdToEmployee",
  }),
  referenceEventType: one(referenceEventTypes, {
    fields: [events.eventTypeId],
    references: [referenceEventTypes.id],
  }),
  artScope: one(arts, {
    // Renamed for clarity from Prisma's default "ART"
    fields: [events.scopeArtId],
    references: [arts.id],
  }),
  organizationScope: one(organizations, {
    // Renamed for clarity
    fields: [events.scopeOrganizationId],
    references: [organizations.id],
  }),
  teamScope: one(teams, {
    // Renamed for clarity
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

export const awardCategoriesRelations = relations(
  awardCategories,
  ({ one, many }) => ({
    referenceAwardCategoryName: one(referenceAwardCategoryNames, {
      fields: [awardCategories.categoryNameId],
      references: [referenceAwardCategoryNames.id],
    }),
    createdBy: one(employees, {
      fields: [awardCategories.createdById],
      references: [employees.id],
      relationName: "AwardCategory_createdByIdToEmployee",
    }),
    event: one(events, {
      fields: [awardCategories.eventId],
      references: [events.id],
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
  createdBy: one(employees, {
    fields: [nominations.createdById],
    references: [employees.id],
    relationName: "Nomination_createdByIdToEmployee",
  }),
  nominatorEmployee: one(employees, {
    fields: [nominations.nominatorEmployeeId],
    references: [employees.id],
    relationName: "Nomination_nominatorEmployeeIdToEmployee",
  }),
  nomineeEmployee: one(employees, {
    fields: [nominations.nomineeEmployeeId],
    references: [employees.id],
    relationName: "Nomination_nomineeEmployeeIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [nominations.updatedById],
    references: [employees.id],
    relationName: "Nomination_updatedByIdToEmployee",
  }),
  award: one(awards, {
    // This is for Award? -> Nomination @relation(fields: [winningNominationId])
    fields: [nominations.id],
    references: [awards.winningNominationId],
  }),
  votes: many(votes),
}));

export const awardsRelations = relations(awards, ({ one }) => ({
  awardCategory: one(awardCategories, {
    fields: [awards.awardCategoryId],
    references: [awardCategories.id],
  }),
  createdBy: one(employees, {
    fields: [awards.createdById],
    references: [employees.id],
    relationName: "Award_createdByIdToEmployee",
  }),
  nominatorEmployee: one(employees, {
    fields: [awards.nominatorEmployeeId],
    references: [employees.id],
    relationName: "Award_nominatorEmployeeIdToEmployee",
  }),
  recipientEmployee: one(employees, {
    fields: [awards.recipientEmployeeId],
    references: [employees.id],
    relationName: "Award_recipientEmployeeIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [awards.updatedById],
    references: [employees.id],
    relationName: "Award_updatedByIdToEmployee",
  }),
  winningNomination: one(nominations, {
    fields: [awards.winningNominationId],
    references: [nominations.id],
  }),
}));

export const employeeArtLinksRelations = relations(
  employeeArtLinks,
  ({ one }) => ({
    art: one(arts, {
      fields: [employeeArtLinks.artId],
      references: [arts.id],
    }),
    employee: one(employees, {
      fields: [employeeArtLinks.employeeId],
      references: [employees.id],
    }),
  })
);

export const employeeAchievementsRelations = relations(
  employeeAchievements,
  ({ one }) => ({
    createdBy: one(employees, {
      fields: [employeeAchievements.createdById],
      references: [employees.id],
      relationName: "EmployeeAchievement_createdByIdToEmployee",
    }),
    employee: one(employees, {
      fields: [employeeAchievements.employeeId],
      references: [employees.id],
      relationName: "EmployeeAchievement_employeeIdToEmployee",
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
    // Prisma doesn't name this relation explicitly, Drizzle can infer or use a default.
  }),
}));

export const performanceCyclesRelations = relations(
  performanceCycles,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [performanceCycles.createdById],
      references: [employees.id],
      relationName: "PerformanceCycle_createdByIdToEmployee",
    }),
    organization: one(organizations, {
      fields: [performanceCycles.organizationId],
      references: [organizations.id],
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
    createdBy: one(employees, {
      fields: [feedbackRequests.createdById],
      references: [employees.id],
      relationName: "FeedbackRequest_createdByIdToEmployee",
    }),
    requestedForEmployee: one(employees, {
      fields: [feedbackRequests.requestedForEmployeeId],
      references: [employees.id],
      relationName: "FeedbackRequest_requestedForEmployeeIdToEmployee",
    }),
    requestedFromEmployee: one(employees, {
      fields: [feedbackRequests.requestedFromEmployeeId],
      references: [employees.id],
      relationName: "FeedbackRequest_requestedFromEmployeeIdToEmployee",
    }),
    requesterEmployee: one(employees, {
      fields: [feedbackRequests.requesterEmployeeId],
      references: [employees.id],
      relationName: "FeedbackRequest_requesterEmployeeIdToEmployee",
    }),
    updatedBy: one(employees, {
      fields: [feedbackRequests.updatedById],
      references: [employees.id],
      relationName: "FeedbackRequest_updatedByIdToEmployee",
    }),
    feedback: one(feedbacks, {
      // For Feedback? @relation(fields: [feedbackRequestId])
      fields: [feedbackRequests.id],
      references: [feedbacks.feedbackRequestId],
    }),
  })
);

export const feedbacksRelations = relations(feedbacks, ({ one, many }) => ({
  createdBy: one(employees, {
    fields: [feedbacks.createdById],
    references: [employees.id],
    relationName: "Feedback_createdByIdToEmployee",
  }),
  feedbackRequest: one(feedbackRequests, {
    fields: [feedbacks.feedbackRequestId],
    references: [feedbackRequests.id],
  }),
  giverEmployee: one(employees, {
    fields: [feedbacks.giverEmployeeId],
    references: [employees.id],
    relationName: "Feedback_giverEmployeeIdToEmployee",
  }),
  performanceCycle: one(performanceCycles, {
    fields: [feedbacks.performanceCycleId],
    references: [performanceCycles.id],
  }),
  receiverEmployee: one(employees, {
    fields: [feedbacks.receiverEmployeeId],
    references: [employees.id],
    relationName: "Feedback_receiverEmployeeIdToEmployee",
  }),
  updatedBy: one(employees, {
    fields: [feedbacks.updatedById],
    references: [employees.id],
    relationName: "Feedback_updatedByIdToEmployee",
  }),
  feedbackGeneralQas: many(feedbackGeneralQas),
  feedbackRatings: many(feedbackRatings),
  performanceFeedbackResponses: many(performanceFeedbackResponses),
}));

export const feedbackGeneralQasRelations = relations(
  feedbackGeneralQas,
  ({ one }) => ({
    feedback: one(feedbacks, {
      fields: [feedbackGeneralQas.feedbackId],
      references: [feedbacks.id],
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
    feedbackRatings: many(feedbackRatings),
  })
);

export const feedbackRatingsRelations = relations(
  feedbackRatings,
  ({ one }) => ({
    feedback: one(feedbacks, {
      fields: [feedbackRatings.feedbackId],
      references: [feedbacks.id],
    }),
    ratingCategory: one(ratingCategories, {
      fields: [feedbackRatings.ratingCategoryId],
      references: [ratingCategories.id],
    }),
  })
);

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
    employeeResponder: one(employees, {
      fields: [performanceFeedbackResponses.employeeResponderId],
      references: [employees.id],
      relationName: "PerformanceFeedbackResponse_employeeResponderIdToEmployee",
    }),
    feedback: one(feedbacks, {
      fields: [performanceFeedbackResponses.feedbackId],
      references: [feedbacks.id],
    }),
    managerResponder: one(employees, {
      fields: [performanceFeedbackResponses.managerResponderId],
      references: [employees.id],
      relationName: "PerformanceFeedbackResponse_managerResponderIdToEmployee",
    }),
    performanceQuestion: one(performanceQuestions, {
      // Corrected from question to performanceQuestion
      fields: [performanceFeedbackResponses.questionId],
      references: [performanceQuestions.id],
    }),
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
    teamFeedbackRatings: many(teamFeedbackRatings),
  })
);

export const teamPerformanceFeedbacksRelations = relations(
  teamPerformanceFeedbacks,
  ({ one, many }) => ({
    createdBy: one(employees, {
      fields: [teamPerformanceFeedbacks.createdById],
      references: [employees.id],
      relationName: "TeamPerformanceFeedback_createdByIdToEmployee",
    }),
    giverEmployee: one(employees, {
      fields: [teamPerformanceFeedbacks.giverEmployeeId],
      references: [employees.id],
      relationName: "TeamPerformanceFeedback_giverEmployeeIdToEmployee",
    }),
    performanceCycle: one(performanceCycles, {
      fields: [teamPerformanceFeedbacks.performanceCycleId],
      references: [performanceCycles.id],
    }),
    team: one(teams, {
      fields: [teamPerformanceFeedbacks.teamId],
      references: [teams.id],
    }),
    updatedBy: one(employees, {
      fields: [teamPerformanceFeedbacks.updatedById],
      references: [employees.id],
      relationName: "TeamPerformanceFeedback_updatedByIdToEmployee",
    }),
    teamFeedbackRatings: many(teamFeedbackRatings),
    teamPerformanceFeedbackResponses: many(teamPerformanceFeedbackResponses),
  })
);

export const teamFeedbackRatingsRelations = relations(
  teamFeedbackRatings,
  ({ one }) => ({
    teamRatingCategory: one(teamRatingCategories, {
      // Corrected from TeamRatingCategory to teamRatingCategory
      fields: [teamFeedbackRatings.teamCategoryId],
      references: [teamRatingCategories.id],
    }),
    teamPerformanceFeedback: one(teamPerformanceFeedbacks, {
      // Corrected
      fields: [teamFeedbackRatings.teamFeedbackId],
      references: [teamPerformanceFeedbacks.id],
    }),
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
    teamPerformanceFeedbackResponses: many(teamPerformanceFeedbackResponses),
  })
);

export const teamPerformanceFeedbackResponsesRelations = relations(
  teamPerformanceFeedbackResponses,
  ({ one }) => ({
    teamPerformanceFeedback: one(teamPerformanceFeedbacks, {
      // Corrected
      fields: [teamPerformanceFeedbackResponses.teamFeedbackId],
      references: [teamPerformanceFeedbacks.id],
    }),
    teamPerformanceQuestion: one(teamPerformanceQuestions, {
      // Corrected
      fields: [teamPerformanceFeedbackResponses.teamQuestionId],
      references: [teamPerformanceQuestions.id],
    }),
  })
);

export const votesRelations = relations(votes, ({ one }) => ({
  createdBy: one(employees, {
    fields: [votes.createdById],
    references: [employees.id],
    relationName: "Vote_createdByIdToEmployee",
  }),
  nomination: one(nominations, {
    fields: [votes.nominationId],
    references: [nominations.id],
  }),
  updatedBy: one(employees, {
    fields: [votes.updatedById],
    references: [employees.id],
    relationName: "Vote_updatedByIdToEmployee",
  }),
  voterEmployee: one(employees, {
    fields: [votes.voterEmployeeId],
    references: [employees.id],
    relationName: "Vote_voterEmployeeIdToEmployee",
  }),
}));
