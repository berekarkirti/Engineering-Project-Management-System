// app/api/progress-tracking/route.js
import { makeListCreate } from "../../../lib/server/crud";

export const { GET, POST } = makeListCreate("progress_tracking", { orderBy: "updated_at" });