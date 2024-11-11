import { tasks } from "@prisma/client";
import { prisma } from "~/services/db.server";
import type { Prisma } from "@prisma/client";
import { SortOrder } from "~/routes/search/route";
import { transformUserTaskApplications } from "~/components/utils/DataTransformation";

export const createTask = async (
  taskData: Partial<tasks>,
  charityId: string,
  userId: string,
) => {
  try {
    if (
      !taskData.title ||
      !taskData.impact ||
      !taskData.deadline ||
      !taskData.description
    ) {
      return { message: "No data", error: "400" };
    }
    const task = await prisma.tasks.create({
      data: {
        title: taskData.title,
        category: taskData.category,
        impact: taskData.impact,
        deadline: taskData.deadline,
        urgency: taskData.urgency,
        deliverables: taskData.deliverables,
        description: taskData.description,
        volunteersNeeded: taskData.volunteersNeeded || 0,
        requiredSkills: taskData.requiredSkills,
        resources: taskData.resources,
        status: "INCOMPLETE",
        ...(charityId && {
          charity: {
            connect: { id: charityId },
          },
        }),
        createdBy: {
          connect: { id: userId },
        },
      },
    });
    return { task, message: "Task successfully created", status: 200 };
  } catch (error) {
    return {
      task: null,
      message: `Unable to create task: ${error}`,
      status: 500,
    };
  }
};

export const getAllTasks = async () => {
  try {
    const allTasks = await prisma.tasks.findMany({
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
    });
    return { allTasks, error: null, message: "Successfully fetched tasks" };
  } catch (error) {
    return { allTasks: null, error, message: "Unable to fetch tasks" };
  }
};

export const getUserTasks = async (
  userRole: string,
  userId?: string,
  charityId?: string,
  deadline?: SortOrder,
  createdAt?: SortOrder,
  updatedAt?: SortOrder,
) => {
  const getOrderDirection = (value: string): SortOrder | undefined => {
    return value === "asc" || value === "desc"
      ? (value as SortOrder)
      : undefined;
  };
  if (userRole === "charity") {
    try {
      console.log("Charity ID", charityId);

      const tasks = await prisma.tasks.findMany({
        where: { userId: userId },
        include: { taskApplications: true, charity: true, createdBy: true },
        orderBy: [
          ...(getOrderDirection(deadline!)
            ? [{ deadline: getOrderDirection(deadline || "desc") }]
            : []),
          ...(getOrderDirection(updatedAt!)
            ? [{ updatedAt: getOrderDirection(updatedAt || "desc") }]
            : []),
          ...(getOrderDirection(createdAt!)
            ? [{ createdAt: getOrderDirection(createdAt || "desc") }]
            : []),
          { createdAt: "desc" },
        ],
      });

      // console.log("returned", tasks);

      return {
        tasks,
        message: "Successfully Retrieved User tasks",
        error: null,
        status: 200,
      };
    } catch (error) {
      return {
        tasks: null,
        message: "No user tasks found",
        error,
        status: 500,
      };
    }
  }
  if (userRole === "techie") {
    try {
      const taskApplications = await prisma.taskApplications.findMany({
        where: { userId },
        include: {
          task: { include: { createdBy: true, taskApplications: true } },
          charity: true,
        },
        orderBy: [
          ...(getOrderDirection(deadline!)
            ? [{ task: { deadline: getOrderDirection(deadline || "desc") } }]
            : []),
          ...(getOrderDirection(updatedAt!)
            ? [{ task: { updatedAt: getOrderDirection(updatedAt || "desc") } }]
            : []),
          ...(getOrderDirection(createdAt!)
            ? [{ task: { createdAt: getOrderDirection(createdAt || "desc") } }]
            : []),
          { createdAt: "desc" },
        ],
      });

      const tasks = transformUserTaskApplications(taskApplications);

      return {
        tasks,
        message: "Successfully Retrieved User tasks",
        error: null,
        status: 200,
      };
    } catch (error) {
      return {
        tasks: null,
        message: "No user tasks found",
        error,
        status: 500,
      };
    }
  }
  return {
    tasks: null,
    message: "No user tasks found",
    error: "No user role provided",
    status: 500,
  };
};

export const deleteUserTaskApplication = async (
  taskId: string,
  userId: string,
) => {
  try {
    const deletedApplication = await prisma.taskApplications.deleteMany({
      where: { taskId, userId },
    });

    return {
      deletedApplication,
      message: "Successfully Deleted User Task Application",
      error: null,
      status: 200,
    };
  } catch (error) {
    return {
      deletedApplication: null,
      message: "Failed to delete user task application",
      error,
      status: 500,
    };
  }
};

export const updateTask = async (
  taskId: string,
  updateTaskData: Prisma.tasksUpdateInput,
) => {
  try {
    const updatedTask = await prisma.tasks.update({
      where: { id: taskId },
      data: updateTaskData,
    });
    return {
      tasks: updatedTask,
      message: "Task successfully updated",
      error: null,
      status: 200,
    };
  } catch (error) {
    return {
      tasks: null,
      message: "Task could not be updated",
      error,
      status: 500,
    };
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    const deletedTask = await prisma.tasks.delete({
      where: { id: taskId },
    });

    return {
      task: deletedTask,
      message: "Task successfully deleted",
      error: null,
      status: 200,
    };
  } catch (error) {
    return {
      task: null,
      message: "Task could not be deleted",
      error,
      status: 500,
    };
  }
};
