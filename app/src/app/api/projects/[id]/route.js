// app/api/projects/[id]/route.js
import { makeOne } from "../../../../lib/server/crud";

export const { GET, PATCH, DELETE } = makeOne("projects");