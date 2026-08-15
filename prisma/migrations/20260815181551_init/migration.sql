-- CreateTable
CREATE TABLE "Score" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "score" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "moveCount" INTEGER NOT NULL,
    "linesPopped" INTEGER NOT NULL,
    "longestLine" INTEGER NOT NULL,
    "ballsCleared" INTEGER NOT NULL,
    "keyVersion" INTEGER NOT NULL,
    "moves" TEXT NOT NULL,
    "engineVersion" INTEGER NOT NULL,
    "boardHash" CHAR(8) NOT NULL,
    "ipHash" CHAR(64) NOT NULL,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "gameId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "keyVersion" INTEGER NOT NULL,
    "balls" BYTEA NOT NULL,
    "ghosts" BYTEA NOT NULL,
    "boardHash" CHAR(8) NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "moveCount" INTEGER NOT NULL DEFAULT 0,
    "over" BOOLEAN NOT NULL DEFAULT false,
    "stats" JSONB NOT NULL,
    "moves" TEXT NOT NULL DEFAULT '',
    "lastPacket" JSONB,
    "lastFrom" INTEGER,
    "lastTo" INTEGER,
    "engineVersion" INTEGER NOT NULL,
    "ipHash" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("gameId")
);

-- CreateTable
CREATE TABLE "SubmissionAttempt" (
    "id" BIGSERIAL NOT NULL,
    "playerId" UUID,
    "ipHash" CHAR(64) NOT NULL,
    "outcome" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Score_gameId_key" ON "Score"("gameId");

-- CreateIndex
CREATE INDEX "Score_score_createdAt_idx" ON "Score"("score" DESC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "GameSession_playerId_createdAt_idx" ON "GameSession"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "GameSession_createdAt_idx" ON "GameSession"("createdAt");

-- CreateIndex
CREATE INDEX "SubmissionAttempt_playerId_createdAt_idx" ON "SubmissionAttempt"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "SubmissionAttempt_ipHash_createdAt_idx" ON "SubmissionAttempt"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "SubmissionAttempt_createdAt_idx" ON "SubmissionAttempt"("createdAt");
