import { makeListCreate } from "../../../lib/server/crud";

export const { GET, POST } = makeListCreate("tpi_logs", { orderBy: "created_at" });
