// app/api/vdcr/route.js
import { makeListCreate } from "../../../lib/server/crud";

export const { GET, POST } = makeListCreate("vdcr_rows", { orderBy: "updated_at" });