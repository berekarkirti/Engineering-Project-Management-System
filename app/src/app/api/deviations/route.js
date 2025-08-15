import { makeListCreate } from "../../../lib/server/crud";
export const { GET, POST } = makeListCreate("deviations", { orderBy: "created_at" });
