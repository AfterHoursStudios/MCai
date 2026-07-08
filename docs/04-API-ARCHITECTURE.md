# API Architecture
# AI Social Media Story Studio

**Version:** 1.0.0
**Last Updated:** 2026-07-01

---

## Overview

The API layer uses a hybrid approach combining:
- **tRPC** for type-safe internal APIs (dashboard, projects, generations)
- **REST API Routes** for external integrations (webhooks, OAuth callbacks)
- **Server Actions** for form submissions and mutations

---

## API Structure

```
/api
├── /auth                    # NextAuth.js endpoints
│   ├── /[...nextauth]       # OAuth handlers
│   └── /session             # Session management
│
├── /trpc                    # tRPC router
│   └── /[trpc]              # All tRPC procedures
│
├── /webhooks                # External webhooks
│   ├── /stripe              # Stripe events
│   └── /resend              # Email events
│
├── /upload                  # File upload handlers
│   ├── /presign             # Generate presigned URLs
│   └── /complete            # Mark upload complete
│
└── /health                  # Health check endpoint
```

---

## tRPC Router Architecture

### Router Organization

```typescript
// src/server/routers/_app.ts
import { router } from '../trpc';
import { authRouter } from './auth';
import { userRouter } from './user';
import { organizationRouter } from './organization';
import { projectRouter } from './project';
import { imageRouter } from './image';
import { storyRouter } from './story';
import { generationRouter } from './generation';
import { brandKitRouter } from './brandKit';
import { templateRouter } from './template';
import { billingRouter } from './billing';
import { settingsRouter } from './settings';
import { adminRouter } from './admin';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  organization: organizationRouter,
  project: projectRouter,
  image: imageRouter,
  story: storyRouter,
  generation: generationRouter,
  brandKit: brandKitRouter,
  template: templateRouter,
  billing: billingRouter,
  settings: settingsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
```

---

## Procedure Definitions

### Auth Router

```typescript
// src/server/routers/auth.ts
export const authRouter = router({
  // Get current session
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.session;
    }),

  // Get current user with organization
  getUser: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: {
          members: {
            include: { organization: true }
          }
        }
      });
    }),
});
```

### User Router

```typescript
// src/server/routers/user.ts
export const userRouter = router({
  // Get user profile
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true
        }
      });
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255).optional(),
      image: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input
      });
    }),

  // Delete user account
  deleteAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { deletedAt: new Date() }
      });
      return { success: true };
    }),
});
```

### Organization Router

```typescript
// src/server/routers/organization.ts
export const organizationRouter = router({
  // List user's organizations
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.organization.findMany({
        where: {
          members: {
            some: { userId: ctx.session.user.id }
          }
        },
        include: {
          _count: { select: { members: true, projects: true } }
        }
      });
    }),

  // Get organization by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { id: input.id },
        include: {
          members: { include: { user: true } },
          brandKits: true,
          _count: { select: { projects: true } }
        }
      });

      // Verify user has access
      await assertOrgAccess(ctx, input.id);
      return org;
    }),

  // Create organization
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: input.name,
            slug: input.slug,
            members: {
              create: {
                userId: ctx.session.user.id,
                role: 'owner'
              }
            }
          }
        });

        await auditLog(tx, {
          userId: ctx.session.user.id,
          organizationId: org.id,
          action: 'organization.create',
          entityType: 'organization',
          entityId: org.id
        });

        return org;
      });
    }),

  // Update organization
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      logo: z.string().url().optional(),
      billingEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOrgRole(ctx, input.id, ['owner', 'admin']);

      const { id, ...data } = input;
      return ctx.db.organization.update({
        where: { id },
        data
      });
    }),

  // Invite member
  inviteMember: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      email: z.string().email(),
      role: z.enum(['admin', 'editor', 'viewer']),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOrgRole(ctx, input.organizationId, ['owner', 'admin']);

      // Send invitation email
      await sendInviteEmail(input.email, input.organizationId, input.role);

      return { success: true };
    }),

  // Remove member
  removeMember: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOrgRole(ctx, input.organizationId, ['owner', 'admin']);

      // Cannot remove owner
      const member = await ctx.db.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: input.userId
          }
        }
      });

      if (member?.role === 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove owner' });
      }

      await ctx.db.member.delete({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: input.userId
          }
        }
      });

      return { success: true };
    }),
});
```

### Project Router

```typescript
// src/server/routers/project.ts
export const projectRouter = router({
  // List projects
  list: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      status: z.enum(['draft', 'processing', 'completed', 'failed']).optional(),
      cursor: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx, input.organizationId);

      const projects = await ctx.db.project.findMany({
        where: {
          organizationId: input.organizationId,
          status: input.status,
          archivedAt: null
        },
        include: {
          images: { take: 4, orderBy: { orderIndex: 'asc' } },
          _count: { select: { images: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined
      });

      let nextCursor: string | undefined;
      if (projects.length > input.limit) {
        const next = projects.pop();
        nextCursor = next?.id;
      }

      return { projects, nextCursor };
    }),

  // Get project by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          images: { orderBy: { orderIndex: 'asc' } },
          story: true,
          generations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              generatedPosts: {
                include: { score: true }
              }
            }
          },
          brandKit: true,
          template: true
        }
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await assertOrgAccess(ctx, project.organizationId);
      return project;
    }),

  // Create project
  create: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      brandKitId: z.string().uuid().optional(),
      templateId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOrgRole(ctx, input.organizationId, ['owner', 'admin', 'editor']);

      return ctx.db.project.create({
        data: {
          ...input,
          userId: ctx.session.user.id
        }
      });
    }),

  // Update project
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      brandKitId: z.string().uuid().nullable().optional(),
      templateId: z.string().uuid().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, project.organizationId, ['owner', 'admin', 'editor']);

      const { id, ...data } = input;
      return ctx.db.project.update({
        where: { id },
        data
      });
    }),

  // Archive project
  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, project.organizationId, ['owner', 'admin', 'editor']);

      return ctx.db.project.update({
        where: { id: input.id },
        data: { archivedAt: new Date() }
      });
    }),

  // Duplicate project
  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: { images: true, story: true }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, project.organizationId, ['owner', 'admin', 'editor']);

      return ctx.db.$transaction(async (tx) => {
        const newProject = await tx.project.create({
          data: {
            organizationId: project.organizationId,
            userId: ctx.session.user.id,
            title: `${project.title} (Copy)`,
            description: project.description,
            brandKitId: project.brandKitId,
            templateId: project.templateId,
          }
        });

        // Copy images
        if (project.images.length > 0) {
          await tx.image.createMany({
            data: project.images.map(img => ({
              projectId: newProject.id,
              originalUrl: img.originalUrl,
              filename: img.filename,
              mimeType: img.mimeType,
              sizeBytes: img.sizeBytes,
              width: img.width,
              height: img.height,
              orderIndex: img.orderIndex
            }))
          });
        }

        // Copy story
        if (project.story) {
          await tx.story.create({
            data: {
              projectId: newProject.id,
              originalContent: project.story.originalContent
            }
          });
        }

        return newProject;
      });
    }),
});
```

### Image Router

```typescript
// src/server/routers/image.ts
export const imageRouter = router({
  // Get presigned upload URL
  getUploadUrl: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      filename: z.string(),
      contentType: z.string(),
      size: z.number().max(20 * 1024 * 1024), // 20MB max
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, project.organizationId, ['owner', 'admin', 'editor']);

      // Validate content type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      if (!allowedTypes.includes(input.contentType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid file type'
        });
      }

      // Generate presigned URL
      const key = `projects/${input.projectId}/images/${crypto.randomUUID()}-${input.filename}`;
      const presignedUrl = await generatePresignedUploadUrl(key, input.contentType);

      return {
        uploadUrl: presignedUrl,
        key,
        expiresIn: 3600
      };
    }),

  // Confirm upload complete
  confirmUpload: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      key: z.string(),
      filename: z.string(),
      contentType: z.string(),
      size: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, project.organizationId, ['owner', 'admin', 'editor']);

      // Get current max order index
      const maxOrder = await ctx.db.image.aggregate({
        where: { projectId: input.projectId },
        _max: { orderIndex: true }
      });

      // Get image dimensions
      const metadata = await getImageMetadata(input.key);

      return ctx.db.image.create({
        data: {
          projectId: input.projectId,
          originalUrl: getPublicUrl(input.key),
          filename: input.filename,
          mimeType: input.contentType,
          sizeBytes: input.size,
          width: metadata.width,
          height: metadata.height,
          orderIndex: (maxOrder._max.orderIndex ?? -1) + 1
        }
      });
    }),

  // Reorder images
  reorder: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      imageIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, project.organizationId, ['owner', 'admin', 'editor']);

      // Update order indices
      await ctx.db.$transaction(
        input.imageIds.map((id, index) =>
          ctx.db.image.update({
            where: { id },
            data: { orderIndex: index }
          })
        )
      );

      return { success: true };
    }),

  // Delete image
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db.image.findUnique({
        where: { id: input.id },
        include: { project: true }
      });

      if (!image) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, image.project.organizationId, ['owner', 'admin', 'editor']);

      // Delete from storage
      await deleteFromStorage(image.originalUrl);
      if (image.enhancedUrl) await deleteFromStorage(image.enhancedUrl);
      if (image.thumbnailUrl) await deleteFromStorage(image.thumbnailUrl);

      await ctx.db.image.delete({ where: { id: input.id } });

      return { success: true };
    }),

  // Set primary image
  setPrimary: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      imageId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, project.organizationId, ['owner', 'admin', 'editor']);

      await ctx.db.$transaction([
        ctx.db.image.updateMany({
          where: { projectId: input.projectId },
          data: { isPrimary: false }
        }),
        ctx.db.image.update({
          where: { id: input.imageId },
          data: { isPrimary: true }
        })
      ]);

      return { success: true };
    }),
});
```

### Story Router

```typescript
// src/server/routers/story.ts
export const storyRouter = router({
  // Get story by project
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgAccess(ctx, project.organizationId);

      return ctx.db.story.findUnique({
        where: { projectId: input.projectId }
      });
    }),

  // Create or update story
  upsert: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      content: z.string().min(1).max(10000),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, project.organizationId, ['owner', 'admin', 'editor']);

      const wordCount = input.content.split(/\s+/).filter(Boolean).length;
      const readingTime = Math.ceil(wordCount / 200) * 60; // seconds

      return ctx.db.story.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          originalContent: input.content,
          wordCount,
          readingTimeSeconds: readingTime
        },
        update: {
          originalContent: input.content,
          wordCount,
          readingTimeSeconds: readingTime,
          analysis: null, // Reset analysis on update
          enhancedContent: null
        }
      });
    }),
});
```

### Generation Router

```typescript
// src/server/routers/generation.ts
export const generationRouter = router({
  // Start generation
  start: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      platforms: z.array(z.enum([
        'instagram', 'facebook', 'linkedin', 'tiktok', 'x',
        'threads', 'pinterest', 'google_business', 'youtube_community'
      ])).min(1),
      contentTypes: z.array(z.enum([
        'post', 'story', 'carousel', 'reel', 'article', 'blog',
        'newsletter', 'press_release', 'email', 'podcast_notes',
        'video_script', 'voiceover'
      ])).default(['post']),
      options: z.object({
        includeEmoji: z.boolean().default(true),
        includeShortVersion: z.boolean().default(true),
        enhanceImages: z.boolean().default(true),
      }).default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: {
          images: true,
          story: true,
          organization: true
        }
      });

      if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, project.organizationId, ['owner', 'admin', 'editor']);

      // Check credits
      if (project.organization.creditsBalance <= 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient credits'
        });
      }

      // Validate project has content
      if (project.images.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Project must have at least one image'
        });
      }

      if (!project.story) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Project must have a story'
        });
      }

      // Create generation record
      const generation = await ctx.db.generation.create({
        data: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
          status: 'pending',
          metadata: {
            platforms: input.platforms,
            contentTypes: input.contentTypes,
            options: input.options
          }
        }
      });

      // Queue background job
      await queueGenerationJob({
        generationId: generation.id,
        projectId: input.projectId,
        platforms: input.platforms,
        contentTypes: input.contentTypes,
        options: input.options
      });

      // Deduct credit
      await ctx.db.$transaction([
        ctx.db.organization.update({
          where: { id: project.organizationId },
          data: { creditsBalance: { decrement: 1 } }
        }),
        ctx.db.usageRecord.create({
          data: {
            organizationId: project.organizationId,
            userId: ctx.session.user.id,
            generationId: generation.id,
            creditsUsed: 1,
            action: 'generation.start',
            description: `Generated content for ${input.platforms.length} platforms`
          }
        })
      ]);

      return generation;
    }),

  // Get generation status
  getStatus: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findUnique({
        where: { id: input.id },
        include: {
          project: true
        }
      });

      if (!generation) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgAccess(ctx, generation.project.organizationId);

      return {
        id: generation.id,
        status: generation.status,
        step: generation.step,
        progress: generation.progress,
        errorMessage: generation.errorMessage
      };
    }),

  // Get generation results
  getResults: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findUnique({
        where: { id: input.id },
        include: {
          project: true,
          generatedPosts: {
            include: { score: true },
            orderBy: [
              { platform: 'asc' },
              { hasEmojis: 'desc' },
              { isShortVersion: 'asc' }
            ]
          }
        }
      });

      if (!generation) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgAccess(ctx, generation.project.organizationId);

      return generation;
    }),

  // Cancel generation
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findUnique({
        where: { id: input.id },
        include: { project: true }
      });

      if (!generation) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, generation.project.organizationId, ['owner', 'admin', 'editor']);

      if (!['pending', 'processing'].includes(generation.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot cancel completed generation'
        });
      }

      // Cancel job
      await cancelGenerationJob(generation.id);

      return ctx.db.generation.update({
        where: { id: input.id },
        data: { status: 'cancelled' }
      });
    }),
});
```

### Brand Kit Router

```typescript
// src/server/routers/brandKit.ts
export const brandKitRouter = router({
  // List brand kits
  list: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx, input.organizationId);

      return ctx.db.brandKit.findMany({
        where: { organizationId: input.organizationId },
        orderBy: [
          { isDefault: 'desc' },
          { name: 'asc' }
        ]
      });
    }),

  // Get brand kit by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const brandKit = await ctx.db.brandKit.findUnique({
        where: { id: input.id }
      });

      if (!brandKit) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgAccess(ctx, brandKit.organizationId);

      return brandKit;
    }),

  // Create brand kit
  create: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      name: z.string().min(1).max(255),
      businessName: z.string().optional(),
      logoUrl: z.string().url().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      fontHeading: z.string().optional(),
      fontBody: z.string().optional(),
      voice: z.string().optional(),
      mission: z.string().optional(),
      targetAudience: z.string().optional(),
      preferredHashtags: z.array(z.string()).optional(),
      preferredCta: z.string().optional(),
      website: z.string().url().optional(),
      socialHandles: z.record(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOrgRole(ctx, input.organizationId, ['owner', 'admin', 'editor']);

      // Check brand kit limit based on plan
      const org = await ctx.db.organization.findUnique({
        where: { id: input.organizationId },
        include: { _count: { select: { brandKits: true } } }
      });

      const limits = { free: 1, starter: 3, pro: 10, agency: 50, enterprise: 999 };
      const limit = limits[org?.plan as keyof typeof limits] ?? 1;

      if (org && org._count.brandKits >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Brand kit limit reached for ${org.plan} plan`
        });
      }

      return ctx.db.brandKit.create({ data: input });
    }),

  // Update brand kit
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      businessName: z.string().optional(),
      logoUrl: z.string().url().nullable().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
      accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
      fontHeading: z.string().nullable().optional(),
      fontBody: z.string().nullable().optional(),
      voice: z.string().nullable().optional(),
      mission: z.string().nullable().optional(),
      targetAudience: z.string().nullable().optional(),
      preferredHashtags: z.array(z.string()).optional(),
      preferredCta: z.string().nullable().optional(),
      website: z.string().url().nullable().optional(),
      socialHandles: z.record(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const brandKit = await ctx.db.brandKit.findUnique({
        where: { id: input.id }
      });

      if (!brandKit) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, brandKit.organizationId, ['owner', 'admin', 'editor']);

      const { id, ...data } = input;
      return ctx.db.brandKit.update({ where: { id }, data });
    }),

  // Set default brand kit
  setDefault: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      brandKitId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOrgRole(ctx, input.organizationId, ['owner', 'admin', 'editor']);

      await ctx.db.$transaction([
        ctx.db.brandKit.updateMany({
          where: { organizationId: input.organizationId },
          data: { isDefault: false }
        }),
        ctx.db.brandKit.update({
          where: { id: input.brandKitId },
          data: { isDefault: true }
        })
      ]);

      return { success: true };
    }),

  // Delete brand kit
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const brandKit = await ctx.db.brandKit.findUnique({
        where: { id: input.id }
      });

      if (!brandKit) throw new TRPCError({ code: 'NOT_FOUND' });

      await assertOrgRole(ctx, brandKit.organizationId, ['owner', 'admin']);

      // Delete logo from storage if exists
      if (brandKit.logoUrl) {
        await deleteFromStorage(brandKit.logoUrl);
      }

      await ctx.db.brandKit.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
```

### Billing Router

```typescript
// src/server/routers/billing.ts
export const billingRouter = router({
  // Get billing info
  getInfo: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertOrgRole(ctx, input.organizationId, ['owner', 'admin']);

      const org = await ctx.db.organization.findUnique({
        where: { id: input.organizationId },
        include: {
          subscription: true
        }
      });

      if (!org) throw new TRPCError({ code: 'NOT_FOUND' });

      // Get Stripe customer portal URL if customer exists
      let portalUrl: string | null = null;
      if (org.stripeCustomerId) {
        const session = await stripe.billingPortal.sessions.create({
          customer: org.stripeCustomerId,
          return_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing`
        });
        portalUrl = session.url;
      }

      return {
        plan: org.plan,
        creditsBalance: org.creditsBalance,
        creditsMonthly: org.creditsMonthly,
        subscription: org.subscription,
        portalUrl
      };
    }),

  // Create checkout session
  createCheckout: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      priceId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOrgRole(ctx, input.organizationId, ['owner', 'admin']);

      const org = await ctx.db.organization.findUnique({
        where: { id: input.organizationId }
      });

      if (!org) throw new TRPCError({ code: 'NOT_FOUND' });

      // Create or get Stripe customer
      let customerId = org.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: org.billingEmail ?? ctx.session.user.email,
          metadata: { organizationId: org.id }
        });
        customerId = customer.id;

        await ctx.db.organization.update({
          where: { id: org.id },
          data: { stripeCustomerId: customerId }
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
        subscription_data: {
          trial_period_days: 14,
          metadata: { organizationId: org.id }
        }
      });

      return { url: session.url };
    }),

  // Get usage history
  getUsage: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      await assertOrgRole(ctx, input.organizationId, ['owner', 'admin']);

      const startDate = input.startDate
        ? new Date(input.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      const usage = await ctx.db.usageRecord.findMany({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: startDate, lte: endDate }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } }
        }
      });

      const summary = await ctx.db.usageRecord.aggregate({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { creditsUsed: true }
      });

      return {
        records: usage,
        totalCreditsUsed: summary._sum.creditsUsed ?? 0
      };
    }),
});
```

---

## Webhook Handlers

### Stripe Webhook

```typescript
// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { env } from '@/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook Error', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoiceFailed(invoice);
      break;
    }
  }

  return new Response('OK', { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.subscription?.metadata?.organizationId;
  if (!organizationId) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanFromPriceId(priceId);
  const credits = getCreditsForPlan(plan);

  await db.$transaction([
    db.organization.update({
      where: { id: organizationId },
      data: {
        plan,
        stripeSubscriptionId: subscription.id,
        creditsBalance: credits,
        creditsMonthly: credits
      }
    }),
    db.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        plan,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null
      },
      update: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    })
  ]);
}
```

---

## Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limiters for different endpoints
export const rateLimiters = {
  // General API: 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Generation: 10 per hour
  generation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'ratelimit:generation',
  }),

  // Upload: 50 per hour
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    analytics: true,
    prefix: 'ratelimit:upload',
  }),

  // Auth: 10 per minute (brute force protection)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
};

export async function checkRateLimit(
  limiter: keyof typeof rateLimiters,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const result = await rateLimiters[limiter].limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid input |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | External service down |
| `INSUFFICIENT_CREDITS` | 402 | No credits remaining |
| `PLAN_LIMIT` | 403 | Plan limit reached |
