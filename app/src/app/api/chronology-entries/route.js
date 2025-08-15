import { makeListCreate } from "../../../lib/server/crud";

export const { GET, POST } = makeListCreate("chronology_entries", { orderBy: "created_at" });
