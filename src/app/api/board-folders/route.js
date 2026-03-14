import dbConnect from '@/lib/db';
import BoardFolder from '@/models/BoardFolder';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request) => {
  try {
    await dbConnect();
    const { name, description } = await request.json();

    if (!name) return apiError('Folder name is required', 400);

    const folder = await BoardFolder.create({
      userId: request.user._id,
      name,
      description
    });

    return apiSuccess(folder, 201);
  } catch (err) {
    console.error('[POST folder create]', err);
    return apiError('Failed to create board folder', 500);
  }
});

export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    
    // Get all folders for the authenticated user (Folders are personal organizations)
    const folders = await BoardFolder.find({ 
      userId: request.user._id, 
      isDeleted: false 
    }).sort({ name: 1 }).lean();

    return apiSuccess({ docs: folders });
  } catch (err) {
    console.error('[GET folders]', err);
    return apiError('Failed to fetch board folders', 500);
  }
});
