import { apiSuccess } from '@/lib/apiHelpers';

export async function POST() {
  const response = apiSuccess({ message: 'Logged out successfully' });
  
  response.cookies.delete('picify_token');
  
  return response;
}
