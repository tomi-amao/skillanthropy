import { TaskStatus, TaskUrgency } from "@prisma/client";
import { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/services/db.server";

export type SortOrder = "asc" | "desc";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get("charity")?.split(",") || [];
  const skills = url.searchParams.get("skills")?.split(",") || [];
  const [urgency] = url.searchParams.get("urgency")?.split(",") || [];
  const [status] = url.searchParams.get("status")?.split(",") || [];
  const [deadline] = url.searchParams.get("deadline")?.split(",") || "";
  const [createdAt] = url.searchParams.get("createdAt")?.split(",") || "";
  const [updatedAt] = url.searchParams.get("updatedAt")?.split(",") || "";

  const getOrderDirection = (value: string): SortOrder | undefined => {
    return value === "asc" || value === "desc"
      ? (value as SortOrder)
      : undefined;
  };

  const filteredTasks = await prisma.tasks.findMany({
    where: {
      ...(category[0] !== "" && { category: { hasSome: category } }),
      ...(skills[0] !== "" && { requiredSkills: { hasSome: skills } }),
      ...(urgency !== "" && { urgency: { equals: urgency as TaskUrgency } }),
      ...(status !== "" && { status: { equals: status as TaskStatus } }),
    },
    include: {
      charity: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      ...(getOrderDirection(deadline)
        ? [{ deadline: getOrderDirection(deadline) }]
        : []),
      ...(getOrderDirection(createdAt)
        ? [{ createdAt: getOrderDirection(createdAt) }]
        : []),
      ...(getOrderDirection(updatedAt)
        ? [{ updatedAt: getOrderDirection(updatedAt) }]
        : []),
      { createdAt: "desc" }, 
    ],
  });
  console.log(filteredTasks);

  return { filteredTasks };
}
