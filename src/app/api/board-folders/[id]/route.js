import dbConnect from '@/lib/db';
import BoardFolder from '@/models/BoardFolder';
import Board from '@/models/Board';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const PATCH = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const { name, description } = await request.json();

    const folder = await BoardFolder.findOne({ _id: id, userId: request.user._id, isDeleted: false });
    if (!folder) return apiError('Folder not found', 404);

    if (name) folder.name = name;
    if (description !== undefined) folder.description = description;

    await folder.save();

    return apiSuccess(folder);
  } catch (err) {
    console.error('[PATCH folder]', err);
    return apiError('Failed to update folder', 500);
  }
});

export const DELETE = withAuth(async (request, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const folder = await BoardFolder.findOne({ _id: id, userId: request.user._id, isDeleted: false });
    if (!folder) return apiError('Folder not found', 404);

    folder.isDeleted = true;
    await folder.save();

    // Detach all boards from this folder
    await Board.updateMany(
      { parentFolderId: folder._id },
      { $set: { parentFolderId: null } }
    );

    return apiSuccess({ message: 'Folder deleted successfully' });
  } catch (err) {
    console.error('[DELETE folder]', err);
    return apiError('Failed to delete folder', 500);
  }
});
