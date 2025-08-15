// app/api/vdcr/[id]/route.js
import { makeOne } from "../../../../lib/server/crud";

export const { GET, PATCH, DELETE } = makeOne("vdcr_rows");