import { makeListCreate } from "../../../lib/server/crud";

export const { GET, POST } = makeListCreate("progress_photos", { orderBy: "created_at" });
