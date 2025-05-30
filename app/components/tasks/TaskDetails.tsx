import { useState, useEffect, SetStateAction, Dispatch } from "react";
import { useFetcher } from "react-router";
import { motion } from "framer-motion";
import DashboardBanner from "../cards/BannerSummaryCard";
import { SecondaryButton, PrimaryButton } from "../utils/BasicButton";
import type { taskApplications, tasks, users } from "@prisma/client";
import { FilePreviewButton, DropdownField } from "../utils/FormField";
import TaskForm from "./TaskForm";
import { TaskApplicants } from "./TaskApplicants";
import { CommentSection } from "../comment/Comment";
import { Alert } from "../utils/Alert";
import { ColorDot } from "../utils/ColourGenerator";
import {
  Files,
  Info,
  Lightbulb,
  ListChecks,
  NotePencil,
  Tag,
  Target,
  MapPin,
  MapTrifold,
  ShareNetwork,
  Check,
  Clock,
  Fire,
} from "@phosphor-icons/react";

interface TaskDetailsProps {
  task: tasks & {
    applications?: {
      user: users;
      application: taskApplications;
    }[];
  };
  userRole: string[];
  userId?: string;
  onEdit: (taskData?: tasks) => void;
  onDelete: () => void;
  isEditing: boolean;
  error?: string;
  isError?: boolean;
  setIsEditing?: Dispatch<SetStateAction<boolean>>;
  userName?: string;
  uploadURL: string;
}

export function TaskDetails({
  task,
  userRole,
  userId,
  onEdit,
  onDelete,
  isEditing,
  error,
  isError,
  setIsEditing,
  userName,
  uploadURL,
}: TaskDetailsProps) {
  const fetcher = useFetcher();
  const [formData, setFormData] = useState<tasks>(task);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const handleAcceptApplication = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "acceptTaskApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
        userId: userId ?? null,
        taskId: task.id,
      },
      { method: "POST" },
    );
  };

  const handleRejectApplication = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "rejectTaskApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
        userId: userId ?? null,
        taskId: task.id,
      },
      { method: "POST" },
    );
  };

  const handleRemoveVolunteer = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "removeVolunteer",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
  };

  const handleUndoStatus = (applicationId: string) => {
    fetcher.submit(
      {
        _action: "undoApplicationStatus",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
  };

  const handleDeleteApplication = (applicationId: string) => {
    if (!applicationId) return;

    fetcher.submit(
      {
        _action: "deleteApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
        userId: userId ?? null,
        taskId: task.id,
      },
      { method: "POST" },
    );
  };

  const handleReapply = (applicationId: string) => {
    if (!applicationId) return;

    fetcher.submit(
      {
        _action: "undoApplicationStatus",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
        userId: userId ?? null,
        taskId: task.id,
      },
      { method: "POST" },
    );
  };

  const handleWithdrawApplication = (applicationId: string) => {
    if (!applicationId) return;

    fetcher.submit(
      {
        _action: "withdrawApplication",
        selectedTaskApplication: JSON.stringify({ id: applicationId }),
      },
      { method: "POST" },
    );
  };

  const handleShare = () => {
    const taskUrl = `${window.location.origin}/task/${task.id}`;

    navigator.clipboard
      .writeText(taskUrl)
      .then(() => {
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy URL: ", err);
      });
  };

  // Update form data when task changes
  useEffect(() => {
    setFormData({
      ...task,
      requiredSkills: task.requiredSkills || [],
    });
  }, [task]);

  const handleSubmit = () => {
    console.log("Taskform data", formData);

    onEdit(formData);
  };

  const handleUpdateTaskStatus = (status: string) => {
    fetcher.submit(
      {
        _action: "updateTask",
        taskId: task.id,
        updateTaskData: JSON.stringify({ status: status }),
      },
      { method: "POST" },
    );
    console.log("Task status updated", status, task.id);
  };

  // Ensure we have valid data
  const displayData = formData || task;
  const requiredSkills = displayData.requiredSkills || [];

  return (
    <motion.div
      className="bg-basePrimary rounded-lg shadow-lg p-2 sm:p-3 md:p-4 lg:p-6 max-w-full border border-baseSecondary/20 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Error message section */}
      {isError && (
        <div className="mb-3 p-2 sm:p-3 bg-dangerPrimary/10 border border-dangerPrimary rounded-lg">
          <span className="text-dangerPrimary text-sm sm:text-base">
            {error || "An error occurred"}
          </span>
        </div>
      )}

      {/* Banner with key information */}
      <div className="flex-1">
        <DashboardBanner
          bannerItems={[
            { title: "Title", value: displayData.title ?? "N/A", type: "task" },
            {
              title: "Status",
              value: displayData.status ?? "N/A",
              type: "circleNotch",
            },
            {
              title: "Charity",
              value: displayData.charity.name ?? "N/A",
              type: "charity",
            },
          ]}
        />
      </div>

      {isEditing ? (
        <TaskForm
          initialData={task}
          onSubmit={handleSubmit}
          onCancel={() => setIsEditing?.(false)}
          isEditing={true}
          error={error}
          uploadURL={uploadURL}
          serverValidation={[]}
          isSubmitting={false}
        />
      ) : (
        <div className="w-full mx-auto mt-3 sm:mt-4">
          {/* Header Section with Key Info */}
          <div className="bg-basePrimaryLight rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 relative overflow-hidden transform transition-all duration-300 hover:shadow-lg">
            {/* Action Bar - NEW position for Priority Badge and Share Button */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                    shadow-sm transition-all duration-300 
                    ${
                      displayData.urgency === "HIGH"
                        ? "bg-dangerPrimary  "
                        : displayData.urgency === "MEDIUM"
                          ? "bg-accentPrimary text-baseSecondary"
                          : "bg-confirmPrimary  "
                    }`}
                  >
                    <Fire
                      weight="fill"
                      className={`w-3.5 h-3.5 ${displayData.urgency === "HIGH" ? "animate-pulse" : ""}`}
                    />
                    {displayData.urgency?.toLowerCase()} priority
                  </span>
                </div>

                {displayData.deadline && (
                  <span className="text-xs text-baseSecondary/80 flex items-center gap-1.5 bg-basePrimary px-2.5 py-1.5 rounded-lg border border-baseSecondary/10">
                    <Clock className="w-3.5 h-3.5" />
                    Due {new Date(displayData.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium 
                    text-baseSecondary bg-basePrimary hover:bg-basePrimaryDark
                    border border-baseSecondary/10 hover:border-baseSecondary/20
                    transition-all duration-300 shadow-sm hover:shadow-md"
                  aria-label="Share this task"
                >
                  <ShareNetwork className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                {/* Copy success tooltip */}
                {showShareTooltip && (
                  <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-confirmPrimary text-basePrimary text-xs rounded-lg shadow-md flex items-center gap-1.5 whitespace-nowrap z-20">
                    <Check className="w-3.5 h-3.5" />
                    <span>Link copied!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Impact Statement with enhanced visual treatment */}
              <div
                className="relative p-3 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 backdrop-blur-sm
                     border border-baseSecondary/10 transition-all duration-300 hover:border-baseSecondary/20"
              >
                <h3
                  className="text-sm font-semibold tracking-wider text-baseSecondary mb-2
                   flex items-center gap-1"
                >
                  <Target
                    size={16}
                    weight="regular"
                    className="text-baseSecondary/70"
                  />
                  Impact
                </h3>
                <p
                  className="text-baseSecondary text-sm md:text-base leading-relaxed font-light
                     [text-wrap:balance] tracking-wide break-words"
                >
                  {displayData.impact}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {/* Description Section */}
              <section
                className="bg-basePrimaryLight rounded-xl p-3 sm:p-4 md:p-6 transition-all duration-300 hover:shadow-lg"
                aria-labelledby="task-description-heading"
              >
                <div
                  className="relative p-3 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 
                  backdrop-blur-sm border border-baseSecondary/10 transition-all duration-300 
                  hover:border-baseSecondary/20 hover:bg-gradient-to-br hover:from-basePrimary/10 hover:to-basePrimary/15"
                >
                  <div className="flex items-center gap-1 mb-2">
                    <NotePencil
                      size={16}
                      weight="regular"
                      className="text-baseSecondary/70"
                    />
                    <h3
                      id="task-description-heading"
                      className="text-sm font-semibold tracking-wider text-baseSecondary"
                    >
                      About this task
                    </h3>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-baseSecondary/10 rounded-full"></div>
                    <p
                      className="text-baseSecondary text-sm md:text-base leading-relaxed font-light tracking-wide
                    [text-wrap:balance] pl-2 transition-all duration-300 group-hover:text-baseSecondary/90 break-words"
                    >
                      {displayData.description || "No description provided."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Deliverables Section */}
              {displayData.deliverables &&
                displayData.deliverables.length > 0 && (
                  <section
                    className="bg-basePrimaryLight rounded-xl p-3 sm:p-4 md:p-6 transition-all duration-300 hover:shadow-lg"
                    aria-labelledby="deliverables-heading"
                  >
                    <div
                      className="relative p-3 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 
                      backdrop-blur-sm border border-baseSecondary/10 transition-all duration-300 
                      hover:border-baseSecondary/20"
                    >
                      <div className="flex items-center gap-1 mb-2">
                        <ListChecks
                          size={16}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        <h3
                          id="deliverables-heading"
                          className="text-sm font-semibold tracking-wider text-baseSecondary"
                        >
                          Key Deliverables
                        </h3>
                      </div>

                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {displayData.deliverables.map((deliverable, index) => (
                          <li
                            key={index}
                            className="group relative p-2 bg-basePrimary rounded-lg border border-baseSecondary/10
                              transition-all duration-300 hover:border-baseSecondary/20 hover:shadow-sm"
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className="w-5 h-5 bg-baseSecondary text-basePrimary rounded-full 
                                flex items-center justify-center flex-shrink-0 font-medium text-xs
                                 group-hover:scale-110 transition-all duration-300"
                              >
                                {index + 1}
                              </span>
                              <span
                                className="text-baseSecondary text-sm leading-relaxed [text-wrap:balance] break-words
                                group-hover:text-baseSecondary/90"
                              >
                                {deliverable}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

              <div>
                {userRole.includes("charity") &&
                  displayData.taskApplications && (
                    <div className="bg-basePrimaryLight rounded-xl p-3 sm:p-4 mt-4">
                      <TaskApplicants
                        applicants={displayData.taskApplications
                          .filter((app) =>
                            ["ACCEPTED", "PENDING"].includes(app.status),
                          )
                          .map((app) => ({
                            application: app,
                            user: app.user,
                          }))}
                        volunteersNeeded={displayData.volunteersNeeded}
                        acceptedCount={
                          displayData.taskApplications.filter(
                            (app) => app.status === "ACCEPTED",
                          ).length
                        }
                        onAccept={handleAcceptApplication}
                        onReject={handleRejectApplication}
                        onRemoveVolunteer={handleRemoveVolunteer}
                        onUndoStatus={handleUndoStatus}
                      />
                    </div>
                  )}
              </div>

              {/* Resources Section */}
              {displayData.resources && displayData.resources.length > 0 && (
                <section
                  className="bg-basePrimaryLight rounded-xl p-3 sm:p-4 md:p-6 transition-all duration-300 hover:shadow-lg"
                  aria-labelledby="resources-heading"
                >
                  <div
                    className="relative p-3 rounded-xl bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 
                    backdrop-blur-sm border border-baseSecondary/10 transition-all duration-300 
                    hover:border-baseSecondary/20"
                  >
                    <div className="flex items-center gap-1 mb-3">
                      <Files
                        size={16}
                        weight="regular"
                        className="text-baseSecondary/70"
                      />
                      <h3
                        id="resources-heading"
                        className="text-sm font-semibold tracking-wide text-baseSecondary"
                      >
                        Resources & Materials
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {displayData.resources.map((resource, index) => (
                        <div key={index} className="relative max-w-full">
                          <FilePreviewButton
                            fileName={resource.name}
                            fileSize={resource.size}
                            fileUrl={resource.uploadURL}
                            fileExtension={resource.extension}
                            isEditing={false}
                          />
                        </div>
                      ))}
                    </div>

                    {displayData.resources.length === 0 && (
                      <p className="text-baseSecondary/70 text-center py-2 text-sm">
                        No resources available for this task
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="space-y-3 sm:space-y-4">
              {/* Quick Stats Card */}
              <div className="bg-basePrimaryLight rounded-xl p-3 sm:p-4 md:p-6">
                <div
                  className="bg-gradient-to-br from-basePrimary/5 to-basePrimary/10 rounded-xl p-3 backdrop-blur-sm
                  border border-baseSecondary/10 transition-all duration-300 hover:border-baseSecondary/20"
                >
                  {/* Header */}

                  <div className="space-y-3 sm:space-y-4">
                    {/* Team Size Card */}
                    <div
                      className="group relative overflow-hidden bg-basePrimary rounded-lg p-3 
                    transition-all duration-300 hover:shadow-md"
                    >
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-accentPrimary/5 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                      <h3 className="text-xs font-medium  tracking-wider text-baseSecondary/70 mb-1">
                        Team Size
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-bold text-baseSecondary">
                          {displayData.volunteersNeeded}
                        </span>
                        <span className="text-sm text-baseSecondary/80">
                          volunteer
                          {displayData.volunteersNeeded !== 1 ? "s" : ""} needed
                        </span>
                      </div>
                    </div>

                    {/* Required Skills Section */}
                    <div>
                      <h3
                        className="text-xs font-medium  tracking-wider text-baseSecondary/70 mb-2
                      flex items-center gap-1"
                      >
                        <Lightbulb
                          size={16}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {requiredSkills.length > 0 ? (
                          requiredSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-basePrimary px-2 py-1 rounded-lg text-xs text-baseSecondary
                        border border-baseSecondary/10 transition-all duration-300
                        hover:border-baseSecondary/20 hover:shadow-sm hover:scale-105
                        flex items-center gap-1"
                            >
                              <ColorDot value={skill} />
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-baseSecondary/60 text-xs italic">
                            No specific skills required
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  {displayData.category && displayData.category.length > 0 && (
                    <div className="mt-3 sm:mt-4">
                      <h3
                        className="text-xs font-medium  tracking-wider text-baseSecondary/70 mb-2
                        flex items-center gap-1"
                      >
                        <Tag
                          size={16}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        Categories
                      </h3>

                      <div
                        className="flex flex-wrap gap-1.5"
                        aria-label="Task categories"
                      >
                        {displayData.category.map((cat, index) => (
                          <span
                            key={index}
                            className="group relative bg-basePrimary px-2 py-1 rounded-lg 
                              border border-baseSecondary/10 transition-all duration-300
                              hover:border-baseSecondary/20 hover:shadow-sm
                              flex items-center gap-1"
                          >
                            <ColorDot value={cat} />

                            <span
                              className="text-xs font-medium text-baseSecondary/80 
                              group-hover:text-baseSecondary transition-colors duration-300"
                            >
                              {cat}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location Section */}
                  {displayData.location && (
                    <div className="mt-3 sm:mt-4">
                      <h3
                        className="text-xs font-medium  tracking-wider text-baseSecondary/70 mb-2
                        flex items-center gap-1"
                      >
                        <MapPin
                          size={16}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        Location
                      </h3>

                      <div className="bg-basePrimary rounded-lg p-3 border border-baseSecondary/10 transition-all duration-300 hover:border-baseSecondary/20">
                        <p className="text-sm text-baseSecondary mb-2">
                          {displayData.location.address}
                        </p>

                        {/* Display a link to Google Maps */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${displayData.location.lat},${displayData.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-baseSecondary hover:underline"
                        >
                          <MapTrifold size={12} />
                          View on Google Maps
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Remote Label when no location */}
                  {!displayData.location && (
                    <div className="mt-3 sm:mt-4">
                      <h3
                        className="text-xs font-medium  tracking-wider text-baseSecondary/70 mb-2
                        flex items-center gap-1"
                      >
                        <MapPin
                          size={16}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        Location
                      </h3>

                      <div className="bg-basePrimary rounded-lg p-3 border border-baseSecondary/10">
                        <p className="text-sm text-baseSecondary flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-confirmPrimary"></span>
                          Remote task
                        </p>
                      </div>
                    </div>
                  )}

                  {userRole.includes("charity") && (
                    <div className="mt-3 sm:mt-4">
                      <h3
                        className="text-xs font-medium  tracking-wider text-baseSecondary/70 mb-2
                        flex items-center gap-1"
                      >
                        <Info
                          size={16}
                          weight="regular"
                          className="text-baseSecondary/70"
                        />
                        Task Status
                      </h3>
                      <DropdownField
                        htmlFor="urgency"
                        value={formData.status || ""}
                        onChange={(value) => handleUpdateTaskStatus(value)}
                        options={[
                          { value: "NOT_STARTED", label: "Not Started" },
                          { value: "IN_PROGRESS", label: "In Progress" },
                          { value: "COMPLETED", label: "Completed " },
                          { value: "CANCELLED", label: "Cancelled" },
                        ]}
                        backgroundColour="bg-basePrimary"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Make sticky on mobile */}
              <div className=" bottom-0  bg-basePrimaryLight rounded-xl p-3 space-y-2 z-0">
                {userRole.includes("charity") ? (
                  <>
                    <SecondaryButton
                      ariaLabel="edit"
                      text="Edit Task"
                      action={() => onEdit()}
                    />
                    <SecondaryButton
                      ariaLabel="delete"
                      text="Delete Task"
                      action={() => setIsDeleteModalOpen(true)}
                    />
                    {isDeleteModalOpen && (
                      <Alert
                        title="Confirm Deletion"
                        message="Are you sure you want to delete this task? This action cannot be undone."
                        onConfirm={onDelete}
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        confirmText="Delete Task"
                        variant="danger"
                      />
                    )}
                  </>
                ) : (
                  <>
                    {task.taskApplications[0].status === "REJECTED" && (
                      <SecondaryButton
                        ariaLabel="delete-application"
                        text="Delete Application"
                        action={() =>
                          handleDeleteApplication(task.taskApplications[0].id)
                        }
                      />
                    )}
                    {task.taskApplications[0].status === "WITHDRAWN" && (
                      <>
                        <PrimaryButton
                          ariaLabel="reapply"
                          text="Re-apply for Task"
                          action={() =>
                            handleReapply(task.taskApplications[0].id)
                          }
                        />
                        <SecondaryButton
                          ariaLabel="delete-application"
                          text="Delete Application"
                          action={() =>
                            handleDeleteApplication(task.taskApplications[0].id)
                          }
                        />
                      </>
                    )}

                    {task.taskApplications[0].status === "PENDING" && (
                      <SecondaryButton
                        ariaLabel="withdraw"
                        text="Withdraw Application"
                        action={() =>
                          handleWithdrawApplication(task.taskApplications[0].id)
                        }
                      />
                    )}
                    {task.taskApplications[0].status === "ACCEPTED" && (
                      <div>
                        <SecondaryButton
                          ariaLabel="withdraw"
                          text="Withdraw From Task"
                          action={() =>
                            handleWithdrawApplication(
                              task.taskApplications[0].id,
                            )
                          }
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Comment Section with Toggle */}
          <div className="mt-3 sm:mt-4">
            {userRole.includes("volunteer") ? (
              task.taskApplications[0].status === "ACCEPTED" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <SecondaryButton
                      ariaLabel="toggle-comments"
                      text={
                        isCommentsExpanded ? "Hide Comments" : "Show Comments"
                      }
                      action={() => setIsCommentsExpanded(!isCommentsExpanded)}
                    />
                  </div>
                  {isCommentsExpanded && (
                    <CommentSection
                      taskId={task.id}
                      currentUser={{
                        id: userId || "",
                        name: userName || "",
                      }}
                    />
                  )}
                </>
              )
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <SecondaryButton
                    ariaLabel="toggle-comments"
                    text={
                      isCommentsExpanded ? "Hide Comments" : "Show Comments"
                    }
                    action={() => setIsCommentsExpanded(!isCommentsExpanded)}
                  />
                </div>
                {isCommentsExpanded && (
                  <CommentSection
                    taskId={task.id}
                    currentUser={{
                      id: userId || "",
                      name: userName || "",
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
