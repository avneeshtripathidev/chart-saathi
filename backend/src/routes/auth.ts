import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase.js';
import { successResponse, errorResponse } from '../types/index.js';

const ProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long'),
  mobileNumber: z.string().trim().regex(/^\d{6,15}$/, 'Mobile number must be between 6 and 15 digits'),
  countryCode: z.string().trim().default('+91'),
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

    const isComplete = Boolean(
      profile?.full_name?.trim() && profile?.mobile_number?.trim()
    );

    return reply.send(
      successResponse({
        profile: profile || null,
        isProfileComplete: isComplete,
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: Boolean(user.email_confirmed_at),
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

    const { fullName, mobileNumber, countryCode } = parsed.data;

    // Additional check for India (+91)
    if (countryCode === '+91') {
      if (mobileNumber.length !== 10 || !/^[6-9]/.test(mobileNumber)) {
        return reply.status(400).send(
          errorResponse('VALIDATION_ERROR', 'Indian mobile number must be 10 digits starting with 6, 7, 8, or 9')
        );
      }
    }

    const now = new Date().toISOString();
    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        mobile_number: mobileNumber,
        country_code: countryCode,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      app.log.error({ err: error }, 'Failed to upsert profile');
      return reply.status(500).send(errorResponse('DB_ERROR', 'Failed to save profile record'));
    }

    return reply.send(
      successResponse({
        profile: updatedProfile,
        isProfileComplete: true,
      })
    );
  });
}
