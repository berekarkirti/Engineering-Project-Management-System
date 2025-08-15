// app/api/progress-tracking/[id]/route.js
import { makeOne } from "../../../../lib/server/crud";

export const { GET, PATCH, DELETE } = makeOne("progress_tracking")