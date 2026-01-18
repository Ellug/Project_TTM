"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { Milestone, Project, ProjectPost, UserProfile } from "@/lib/types";
import { boardCategories } from "@/lib/constants";
import { DiscordService } from "@/lib/services/DiscordService";
import { ProjectPostService } from "@/lib/services/ProjectPostService";
import { ProjectService } from "@/lib/services/ProjectService";
import { TaskService } from "@/lib/services/TaskService";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Chip } from "@/components/atoms/Chip";
import { InputField } from "@/components/atoms/InputField";
import { Panel } from "@/components/atoms/Panel";
import { SelectField } from "@/components/atoms/SelectField";
import { FormField } from "@/components/molecules/FormField";
import {
  MarkdownEditorPanel,
  MarkdownPreview,
} from "@/components/molecules/MarkdownEditorPanel";
import { toDateString } from "@/lib/utils";

type ProjectBoardProps = {
  projectId: string;
  project: Project | null;
  posts: ProjectPost[];
  milestones: Milestone[];
  members: UserProfile[];
  canEdit: boolean;
};

type PostDraft = {
  title: string;
  category: string;
  content: string;
};

export const ProjectBoard = ({
  projectId,
  project,
  posts,
  milestones,
  members,
  canEdit,
}: ProjectBoardProps) => {
  const { user, profile } = useAuth();
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [sendingPostId, setSendingPostId] = useState<string | null>(null);
  const [newPost, setNewPost] = useState<PostDraft>({
    title: "",
    category: "",
    content: "",
  });
  const [editPost, setEditPost] = useState<PostDraft>({
    title: "",
    category: "",
    content: "",
  });
  const [savingPost, setSavingPost] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [milestoneSelection, setMilestoneSelection] = useState<
    Record<string, string>
  >({});

  const userName =
    profile?.nickname ||
    profile?.displayName ||
    profile?.email ||
    "Unknown";
  const projectName = project?.name || "Unknown Project";

  const memberById = useMemo(() => {
    const map = new Map<string, UserProfile>();
    members.forEach((member) => map.set(member.uid, member));
    return map;
  }, [members]);

  const availableCategories = useMemo(() => {
    const unique = new Set<string>();
    const ordered: string[] = [];
    boardCategories.forEach((category) => {
      if (!unique.has(category)) {
        unique.add(category);
        ordered.push(category);
      }
    });
    posts.forEach((post) => {
      const category = post.category?.trim();
      if (!category || unique.has(category)) return;
      unique.add(category);
      ordered.push(category);
    });
    return ordered;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeCategories.length === 0) return posts;
    const active = new Set(activeCategories.map((item) => item.toLowerCase()));
    return posts.filter((post) =>
      active.has((post.category || "Uncategorized").toLowerCase())
    );
  }, [posts, activeCategories]);

  const sortedPosts = useMemo(() => {
    return filteredPosts.slice().sort((a, b) => {
      const aTime = a.updatedAt?.toMillis() || a.createdAt?.toMillis() || 0;
      const bTime = b.updatedAt?.toMillis() || b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
  }, [filteredPosts]);

  const defaultMilestoneId = useMemo(() => {
    const active = milestones.find((item) => item.status === "Active");
    return active?.id || milestones[0]?.id || "";
  }, [milestones]);

  const milestonesById = useMemo(() => {
    const map = new Map<string, Milestone>();
    milestones.forEach((item) => map.set(item.id, item));
    return map;
  }, [milestones]);

  const resolveMilestoneId = (postId: string) =>
    milestoneSelection[postId] || defaultMilestoneId;

  const resolveAuthor = (post: ProjectPost) => {
    if (post.authorName || post.authorPhotoURL) {
      return {
        name: post.authorName || "Unknown",
        photo: post.authorPhotoURL || "",
      };
    }
    const member = memberById.get(post.authorId);
    return {
      name: member?.nickname || member?.displayName || member?.email || "Unknown",
      photo: member?.photoURL || "",
    };
  };

  const updateNewPost = (updates: Partial<PostDraft>) => {
    setNewPost((prev) => ({ ...prev, ...updates }));
  };

  const updateEditPost = (updates: Partial<PostDraft>) => {
    setEditPost((prev) => ({ ...prev, ...updates }));
  };

  const clearEdit = () => {
    setEditingPostId(null);
    setEditPost({ title: "", category: "", content: "" });
  };

  const canPublish =
    Boolean(newPost.title.trim()) && Boolean(newPost.category.trim());

  const handleCreatePost = async () => {
    if (!projectId || !user || !canEdit || !canPublish) return;
    setSavingPost(true);
    try {
      const title = newPost.title.trim();
      const category = newPost.category.trim();
      await ProjectPostService.createPost(projectId, {
        title,
        content: newPost.content,
        category,
        authorId: user.uid,
        authorName: userName,
        authorPhotoURL: profile?.photoURL || "",
      });
      await ProjectService.touchProject(projectId);
      void DiscordService.notifyBoardPostCreated(userName, projectName, title);
      setNewPost({ title: "", category: "", content: "" });
      setIsCreateFormOpen(false);
    } finally {
      setSavingPost(false);
    }
  };

  const handleStartEdit = (post: ProjectPost) => {
    setEditingPostId(post.id);
    setExpandedPostId(post.id);
    setEditPost({
      title: post.title,
      category: post.category,
      content: post.content,
    });
  };

  const handleSaveEdit = async (post: ProjectPost) => {
    if (!projectId || !canEdit || savingEdit) return;
    if (!editPost.title.trim() || !editPost.category.trim()) return;
    setSavingEdit(true);
    try {
      await ProjectPostService.updatePost(projectId, post.id, {
        title: editPost.title.trim(),
        category: editPost.category.trim(),
        content: editPost.content,
      });
      await ProjectService.touchProject(projectId);
      void DiscordService.notifyBoardPostUpdated(
        userName,
        projectName,
        editPost.title.trim()
      );
      clearEdit();
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePost = async (post: ProjectPost) => {
    if (!projectId || !canEdit || deletingPostId) return;
    const confirmed = window.confirm(
      `Delete "${post.title}"? This cannot be undone.`
    );
    if (!confirmed) return;
    setDeletingPostId(post.id);
    try {
      await ProjectPostService.deletePost(projectId, post.id);
      void DiscordService.notifyBoardPostDeleted(userName, projectName, post.title);
      if (expandedPostId === post.id) {
        setExpandedPostId(null);
      }
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleSendToTask = async (post: ProjectPost) => {
    if (!projectId || !user || !canEdit || sendingPostId) return;
    const milestoneId = resolveMilestoneId(post.id);
    if (!milestoneId) return;
    setSendingPostId(post.id);
    try {
      await TaskService.createTask(projectId, milestoneId, {
        title: post.title,
        description: post.content,
        priority: "Medium",
        dueDate: "",
        creatorId: user.uid,
      });
      await ProjectService.touchProject(projectId);
      const milestoneName = milestonesById.get(milestoneId)?.title || "Milestone";
      void DiscordService.notifyTaskCreated(
        userName,
        projectName,
        milestoneName,
        post.title
      );
    } finally {
      setSendingPostId(null);
    }
  };

  const toggleCategoryFilter = (category: string) => {
    setActiveCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category);
      }
      return [...prev, category];
    });
  };

  return (
    <section className="grid gap-4">
      {/* Board Toggle Button */}
      <Panel className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Project Board
            </h3>
            <Chip>{posts.length} posts</Chip>
            {!canEdit && <Chip>Read-only</Chip>}
          </div>
          <Button
            variant="secondary"
            className="text-xs uppercase tracking-[0.2em]"
            onClick={() => setIsBoardOpen((prev) => !prev)}
          >
            {isBoardOpen ? "Close board" : "Open board"}
          </Button>
        </div>
      </Panel>

      {/* Board Content */}
      <div
        className={clsx(
          "board-content grid gap-4 overflow-hidden transition-all duration-300 ease-out",
          isBoardOpen
            ? "max-h-[5000px] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Post Creation Form */}
        <Panel className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[var(--text)]">
                New Post
              </span>
              <span className="text-xs text-[var(--muted)]">
                Share announcements, ideas, or bug reports
              </span>
            </div>
            <Button
              variant="ghost"
              className="text-xs uppercase tracking-[0.2em]"
              onClick={() => setIsCreateFormOpen((prev) => !prev)}
              disabled={!canEdit}
            >
              {isCreateFormOpen ? "Cancel" : "Write"}
            </Button>
          </div>

          {/* Create Form Content */}
          <div
            className={clsx(
              "grid overflow-hidden transition-all duration-300 ease-out",
              isCreateFormOpen
                ? "mt-5 max-h-[800px] opacity-100"
                : "mt-0 max-h-0 opacity-0"
            )}
          >
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Title">
                  <InputField
                    value={newPost.title}
                    onChange={(event) =>
                      updateNewPost({ title: event.target.value })
                    }
                    placeholder="Write a clear subject..."
                    disabled={!canEdit}
                  />
                </FormField>
                <FormField label="Category">
                  <InputField
                    value={newPost.category}
                    onChange={(event) =>
                      updateNewPost({ category: event.target.value })
                    }
                    placeholder="Notice, Bug Report, Idea..."
                    disabled={!canEdit}
                  />
                </FormField>
              </div>
              {availableCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={clsx(
                        "chip text-[10px] uppercase tracking-[0.2em] transition-all duration-200",
                        newPost.category === category
                          ? "border-[var(--accent-border-strong)] bg-[var(--accent-fill)] text-[var(--text)]"
                          : "text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent-border-soft)]"
                      )}
                      onClick={() => updateNewPost({ category })}
                      disabled={!canEdit}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
              <MarkdownEditorPanel
                value={newPost.content}
                onChange={(value) => updateNewPost({ content: value })}
                canEdit={canEdit}
                allowModeToggle
                initialMode="edit"
                headerLabel="Content"
                placeholder="Share details with Markdown..."
                hint="Supports tables, code blocks, %%alert%%, and checklists."
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={handleCreatePost}
                  disabled={!canPublish || savingPost || !canEdit}
                >
                  {savingPost ? "Publishing..." : "Publish"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreateFormOpen(false);
                    setNewPost({ title: "", category: "", content: "" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Panel>

        {/* Posts List with Filters */}
        <Panel className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
              <span>
                {filteredPosts.length === posts.length
                  ? `${posts.length} posts`
                  : `${filteredPosts.length} of ${posts.length} posts`}
              </span>
            </div>
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={clsx(
                    "chip text-[10px] uppercase tracking-[0.2em] transition-all duration-200",
                    activeCategories.length === 0
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] font-bold shadow-[0_0_12px_var(--accent),0_0_4px_var(--accent)] scale-105"
                      : "text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent-border-soft)] hover:bg-[var(--surface-hover)]"
                  )}
                  onClick={() => setActiveCategories([])}
                  aria-pressed={activeCategories.length === 0}
                >
                  All
                </button>
                {availableCategories.map((category) => {
                  const isActive = activeCategories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      className={clsx(
                        "chip text-[10px] uppercase tracking-[0.2em] transition-all duration-200",
                        isActive
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] font-bold shadow-[0_0_12px_var(--accent),0_0_4px_var(--accent)] scale-105"
                          : "text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent-border-soft)] hover:bg-[var(--surface-hover)]"
                      )}
                      onClick={() => toggleCategoryFilter(category)}
                      aria-pressed={isActive}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3">
            {sortedPosts.length === 0 ? (
              <div className="p-4 text-sm text-[var(--muted)] text-center">
                No board posts yet. Click &quot;Write&quot; above to start.
              </div>
            ) : (
              sortedPosts.map((post, index) => {
                const isExpanded = expandedPostId === post.id;
                const isEditing = editingPostId === post.id;
                const category = post.category?.trim() || "Uncategorized";
                const author = resolveAuthor(post);
                const postTimestamp = post.updatedAt || post.createdAt;
                const milestoneId = resolveMilestoneId(post.id);
                const milestoneOptions = milestones.length > 0;

                return (
                  <Card
                    key={post.id}
                    className="p-4 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="grid gap-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold text-[var(--text)] truncate">
                            {post.title}
                          </h4>
                          <Chip>{category}</Chip>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                          <Avatar name={author.name} src={author.photo} size="sm" />
                          <span>{author.name}</span>
                          <span>•</span>
                          <span>{toDateString(postTimestamp)}</span>
                          {post.updatedAt && <span>(edited)</span>}
                        </div>
                        {!isExpanded && post.content && (
                          <p className="text-sm text-[var(--muted)] line-clamp-2">
                            {post.content.split("\n")[0].slice(0, 150)}
                            {post.content.length > 150 && "..."}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          className="text-[11px] uppercase tracking-[0.2em]"
                          onClick={() =>
                            setExpandedPostId(isExpanded ? null : post.id)
                          }
                        >
                          {isExpanded ? "Hide" : "View"}
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            className="text-[11px] uppercase tracking-[0.2em]"
                            onClick={() =>
                              isEditing ? clearEdit() : handleStartEdit(post)
                            }
                          >
                            {isEditing ? "Cancel" : "Edit"}
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            className="text-[11px] uppercase tracking-[0.2em] text-[var(--danger)]"
                            onClick={() => handleDeletePost(post)}
                            disabled={deletingPostId === post.id}
                          >
                            {deletingPostId === post.id ? "..." : "Delete"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content with Animation */}
                    <div
                      className={clsx(
                        "grid overflow-hidden transition-all duration-300 ease-out",
                        isExpanded
                          ? "mt-4 max-h-[2000px] opacity-100"
                          : "mt-0 max-h-0 opacity-0"
                      )}
                    >
                      <div className="grid gap-4">
                        {isEditing ? (
                          <>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <FormField label="Title">
                                <InputField
                                  value={editPost.title}
                                  onChange={(event) =>
                                    updateEditPost({ title: event.target.value })
                                  }
                                  disabled={!canEdit}
                                />
                              </FormField>
                              <FormField label="Category">
                                <InputField
                                  value={editPost.category}
                                  onChange={(event) =>
                                    updateEditPost({ category: event.target.value })
                                  }
                                  disabled={!canEdit}
                                />
                              </FormField>
                            </div>
                            {availableCategories.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {availableCategories.map((item) => (
                                  <button
                                    key={item}
                                    type="button"
                                    className={clsx(
                                      "chip text-[10px] uppercase tracking-[0.2em] transition-all duration-200",
                                      editPost.category === item
                                        ? "border-[var(--accent-border-strong)] bg-[var(--accent-fill)] text-[var(--text)]"
                                        : "text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent-border-soft)]"
                                    )}
                                    onClick={() => updateEditPost({ category: item })}
                                    disabled={!canEdit}
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            )}
                            <MarkdownEditorPanel
                              value={editPost.content}
                              onChange={(value) => updateEditPost({ content: value })}
                              canEdit={canEdit}
                              allowModeToggle
                              initialMode="edit"
                              headerLabel="Content"
                              placeholder="Update the post content..."
                              hint="Supports tables, code blocks, %%alert%%, and checklists."
                            />
                            <div className="flex items-center gap-3">
                              <Button
                                variant="primary"
                                onClick={() => handleSaveEdit(post)}
                                disabled={
                                  savingEdit ||
                                  !editPost.title.trim() ||
                                  !editPost.category.trim()
                                }
                              >
                                {savingEdit ? "Saving..." : "Save"}
                              </Button>
                              <Button variant="ghost" onClick={clearEdit}>
                                Cancel
                              </Button>
                            </div>
                          </>
                        ) : (
                          <MarkdownPreview
                            value={post.content}
                            canEdit={canEdit}
                            onAutoSave={(value) => {
                              if (!canEdit || !projectId) return;
                              ProjectPostService.updatePost(projectId, post.id, {
                                content: value,
                              }).catch(() => {});
                            }}
                            emptyText="No content yet."
                            className="markdown-compact"
                          />
                        )}

                        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
                          <span>Send to task</span>
                          <SelectField
                            value={milestoneId}
                            onChange={(event) =>
                              setMilestoneSelection((prev) => ({
                                ...prev,
                                [post.id]: event.target.value,
                              }))
                            }
                            disabled={!milestoneOptions || !canEdit}
                            className="text-xs"
                          >
                            {milestones.length === 0 ? (
                              <option value="">No milestones</option>
                            ) : (
                              milestones.map((milestone) => (
                                <option key={milestone.id} value={milestone.id}>
                                  {milestone.title}
                                </option>
                              ))
                            )}
                          </SelectField>
                          <Button
                            variant="secondary"
                            className="text-[11px] uppercase tracking-[0.2em]"
                            onClick={() => handleSendToTask(post)}
                            disabled={!milestoneOptions || !canEdit || sendingPostId === post.id}
                          >
                            {sendingPostId === post.id ? "Sending..." : "Create task"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </Panel>
      </div>
    </section>
  );
};
