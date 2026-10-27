import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase.js';
import { successResponse, errorResponse } from '../types/index.js';

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

const ProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_REGEX, 'Username must be 3-30 lowercase letters, numbers, or underscores')
    .optional(),
  mobileNumber: z.string().trim().regex(/^\d{6,15}$/, 'Mobile number must be between 6 and 15 digits'),
  countryCode: z.string().trim().default('+91'),
  avatarUrl: z.string().trim().optional(),
});

const PreferencesSchema = z.object({
  notificationPreferences: z
    .object({
      email_alerts: z.boolean().optional(),
      push_notifications: z.boolean().optional(),
      chart_updates: z.boolean().optional(),
    })
    .optional(),
  privacySettings: z
    .object({
      show_profile: z.boolean().optional(),
      activity_status: z.boolean().optional(),
    })
    .optional(),
});

async function authenticateRequest(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send(errorResponse('UNAUTHORIZED', 'Missing or invalid Authorization header'));
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    reply.status(401).send(errorResponse('UNAUTHORIZED', 'Invalid or expired session token'));
    return null;
  }

  return user;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/auth/username-available?username=xyz
   * Check if a unique username is available
   */
  app.get('/username-available', async (request: FastifyRequest, reply: FastifyReply) => {
    const { username } = request.query as { username?: string };
    const cleanUsername = (username || '').trim().toLowerCase();

    if (!cleanUsername) {
      return reply.status(400).send(errorResponse('VALIDATION_ERROR', 'Username query parameter is required'));
    }

    if (!USERNAME_REGEX.test(cleanUsername)) {
      return reply.send(
        successResponse({
          available: false,
          username: cleanUsername,
          message: 'Username must be 3-30 characters with lowercase letters, numbers, or underscores only',
        })
      );
    }

    // Optional user ID to exclude (e.g. current user keeping their own username)
    const authHeader = request.headers.authorization;
    let currentUserId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data } = await supabaseAdmin.auth.getUser(token);
      currentUserId = data.user?.id || null;
    }

    let query = supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername);

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data: existingUser, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      app.log.error({ err: error }, 'Error checking username');
      return reply.status(500).send(errorResponse('DB_ERROR', 'Failed to check username'));
    }

    const isAvailable = !existingUser;
    return reply.send(
      successResponse({
        available: isAvailable,
        username: cleanUsername,
        message: isAvailable ? 'Username is available' : 'Username is already taken',
      })
    );
  });

  /**
   * GET /api/v1/auth/profile
   * Fetch profile for current authenticated user
   */
  app.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticateRequest(request, reply);
    if (!user) return;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      app.log.error({ err: error }, 'Error fetching profile');
      return reply.status(500).send(errorResponse('DB_ERROR', 'Failed to retrieve profile'));
    }

    const hasName = Boolean(profile?.full_name?.trim());
    const hasMobile = Boolean(profile?.mobile_number?.trim());
    const isComplete = Boolean(profile?.onboarding_completed || (hasName && hasMobile));

    return reply.send(
      successResponse({
        profile: profile || null,
        isProfileComplete: isComplete,
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: Boolean(user.email_confirmed_at),
          createdAt: user.created_at,
        },
      })
    );
  });

  /**
   * POST /api/v1/auth/profile
   * Create or update profile for current authenticated user
   */
  app.post('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticateRequest(request, reply);
    if (!user) return;

    const parsed = ProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', parsed.error.errors[0]?.message || 'Invalid input')
      );
    }

    const { fullName, username, mobileNumber, countryCode, avatarUrl } = parsed.data;

    // Check India mobile format
    if (countryCode === '+91') {
      if (mobileNumber.length !== 10 || !/^[6-9]/.test(mobileNumber)) {
        return reply.status(400).send(
          errorResponse('VALIDATION_ERROR', 'Indian mobile number must be 10 digits starting with 6, 7, 8, or 9')
        );
      }
    }

    // Check username uniqueness if provided
    if (username) {
      const { data: conflict } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .neq('id', user.id)
        .maybeSingle();

      if (conflict) {
        return reply.status(409).send(
          errorResponse('CONFLICT', 'This username is already taken. Please choose another.')
        );
      }
    }

    const now = new Date().toISOString();
    const payload: Record<string, any> = {
      id: user.id,
      full_name: fullName,
      mobile_number: mobileNumber,
      country_code: countryCode,
      onboarding_completed: true,
      updated_at: now,
    };

    if (username) payload.username = username;
    if (avatarUrl !== undefined) payload.avatar_url = avatarUrl;

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      app.log.error({ err: error }, 'Failed to upsert profile');
      return reply.status(500).send(errorResponse('DB_ERROR', error.message || 'Failed to save profile record'));
    }

    return reply.send(
      successResponse({
        profile: updatedProfile,
        isProfileComplete: true,
      })
    );
  });

  /**
   * PUT /api/v1/auth/preferences
   * Update notification and privacy preferences
   */
  app.put('/preferences', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticateRequest(request, reply);
    if (!user) return;

    const parsed = PreferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', parsed.error.errors[0]?.message || 'Invalid preferences payload')
      );
    }

    const { notificationPreferences, privacySettings } = parsed.data;
    const now = new Date().toISOString();

    // Fetch existing preferences to merge cleanly
    const { data: current } = await supabaseAdmin
      .from('profiles')
      .select('notification_preferences, privacy_settings')
      .eq('id', user.id)
      .maybeSingle();

    const mergedNotifications = {
      ...(current?.notification_preferences || { email_alerts: true, push_notifications: true, chart_updates: true }),
      ...notificationPreferences,
    };

    const mergedPrivacy = {
      ...(current?.privacy_settings || { show_profile: false, activity_status: true }),
      ...privacySettings,
    };

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({
        notification_preferences: mergedNotifications,
        privacy_settings: mergedPrivacy,
        updated_at: now,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return reply.status(500).send(errorResponse('DB_ERROR', 'Failed to update preferences'));
    }

    return reply.send(successResponse(updated));
  });

  /**
   * DELETE /api/v1/auth/account
   * Permanently delete user account and associated profile
   */
  app.delete('/account', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticateRequest(request, reply);
    if (!user) return;

    // Delete user profile first (or rely on CASCADE foreign key)
    await supabaseAdmin.from('profiles').delete().eq('id', user.id);

    // Delete user from Supabase auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      app.log.error({ err: error }, 'Error deleting user account');
      return reply.status(500).send(errorResponse('AUTH_ERROR', error.message || 'Failed to delete user account'));
    }

    return reply.send(
      successResponse({
        deleted: true,
        message: 'Account and profile deleted successfully.',
      })
    );
  });
}
