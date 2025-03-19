-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PumpCurve" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pumpModelId" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "points" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PumpCurve_pumpModelId_fkey" FOREIGN KEY ("pumpModelId") REFERENCES "PumpModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PumpCurve" ("createdAt", "id", "points", "pumpModelId", "speed", "updatedAt") SELECT "createdAt", "id", "points", "pumpModelId", "speed", "updatedAt" FROM "PumpCurve";
DROP TABLE "PumpCurve";
ALTER TABLE "new_PumpCurve" RENAME TO "PumpCurve";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
