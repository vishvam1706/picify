import { NextResponse } from 'next/server';

// ── Standard JSON responses ───────────────────────────────────
export function apiSuccess(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message, status = 400, details = null) {
  return NextResponse.json(
    { success: false, error: message, ...(details && { details }) },
    { status }
  );
}

// ── Auth wrappers for route handlers ─────────────────────────
import { requireAuth } from './auth';
import dbConnect from './db';
import User from '@/models/User';

/**
 * Wrap a route handler to require a valid JWT.
 * Injects `req.user` (populated User doc) before calling handler.
 */
export function withAuth(handler) {
  return async (request, context) => {
    await dbConnect();
    const payload = await requireAuth(request);
    if (!payload) {
      return apiError('Unauthorized', 401);
    }
    const user = await User.findById(payload.id).select('-password -twoFactorSecret');
    if (!user || !user.isActive || user.isDeleted) {
      return apiError('Account not found or deactivated', 401);
    }
    request.user = user;
    return handler(request, context);
  };
}

/**
 * Wrap a route handler to require admin access.
 */
export function withAdmin(handler) {
  return withAuth(async (request, context) => {
    if (request.user.role !== 'admin') {
      return apiError('Forbidden — admin only', 403);
    }
    return handler(request, context);
  });
}

/**
 * Wrap a route handler that optionally reads auth (guest-friendly).
 * Injects `req.user` if authenticated, null otherwise.
 */
export function withOptionalAuth(handler) {
  return async (request, context) => {
    await dbConnect();
    const payload = await requireAuth(request);
    if (payload) {
      const user = await User.findById(payload.id).select('-password -twoFactorSecret');
      request.user = user || null;
    } else {
      request.user = null;
    }
    return handler(request, context);
  };
}

/**
 * Parse multipart/form-data in Next.js route handlers.
 * Returns { fields, files } where files[fieldName] = Buffer.
 */
export async function parseFormData(request) {
  const formData = await request.formData();
  const fields = {};
  const files = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const arrayBuffer = await value.arrayBuffer();
      files[key] = {
        buffer: Buffer.from(arrayBuffer),
        originalname: value.name,
        mimetype: value.type,
        size: value.size,
      };
    } else {
      if (fields[key]) {
        // Multiple values → array
        fields[key] = Array.isArray(fields[key])
          ? [...fields[key], value]
          : [fields[key], value];
      } else {
        fields[key] = value;
      }
    }
  }

  return { fields, files };
}

/**
 * Parse multipart/form-data for multiple files with the same field name.
 */
export async function parseMultiFormData(request) {
  const formData = await request.formData();
  const fields = {};
  const fileList = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const arrayBuffer = await value.arrayBuffer();
      fileList.push({
        fieldname: key,
        buffer: Buffer.from(arrayBuffer),
        originalname: value.name,
        mimetype: value.type,
        size: value.size,
      });
    } else {
      fields[key] = value;
    }
  }

  return { fields, files: fileList };
}
