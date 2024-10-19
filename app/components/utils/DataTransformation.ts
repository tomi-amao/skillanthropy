type taskApplications = {
  id: string;
  taskId: string;
  userId: string;
  charityId: string | null;
  status: string;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  task: {
    resources: any[];
    id: string;
    title: string;
    description: string;
    impact: string;
    requiredSkills: string[];
    estimatedHours: number | null;
    category: string[];
    urgency: string;
    volunteersNeeded: number;
    deliverables: string[];
    deadline: Date;
    charityId: string;
    userId: string;
    status: string;
    location: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
      id: string;
      techTitle: string | null;
      zitadelId: string;
      email: string;
      name: string;
      skills: string[];
      bio: string | null;
      profilePicture: string | null;
      createdAt: Date;
      updatedAt: Date;
      locale: string;
      roles: string[];
      permissions: string[];
      charityId: string;
    };
  };
  charity: {
    id: string;
    name: string;
    description: string;
    website: string;
    contactPerson: string | null;
    contactEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
  };
};

export function transformUserTaskApplications(
  firstArray: taskApplications[] | null,
) {
  return firstArray?.map((item) => ({
    resources: item.task.resources,
    id: item.task.id,
    title: item.task.title,
    description: item.task.description,
    impact: item.task.impact,
    requiredSkills: item.task.requiredSkills,
    estimatedHours: item.task.estimatedHours,
    category: item.task.category,
    urgency: item.task.urgency,
    volunteersNeeded: item.task.volunteersNeeded,
    deliverables: item.task.deliverables,
    deadline: item.task.deadline,
    charityId: item.task.charityId,
    userId: item.task.userId,
    status: item.task.status,
    location: item.task.location,
    createdAt: item.task.createdAt,
    updatedAt: item.task.updatedAt,
    taskApplications: [
      {
        id: item.id,
        userId: item.userId,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    ],
    charity: {
      id: item.charity.id,
      name: item.charity.name,
      description: item.charity.description,
      website: item.charity.website,
      contactPerson: item.charity.contactPerson,
      contactEmail: item.charity.contactEmail,
      createdAt: item.charity.createdAt,
      updatedAt: item.charity.updatedAt,
      tags: item.charity.tags,
    },
    createdBy: item.task.createdBy,
  }));
}
