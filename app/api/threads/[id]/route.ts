import { threadRepository } from '@/lib/db/operations';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const thread = await threadRepository.getThread(params.id);
  if (!thread) return new Response('Not found', { status: 404 });
  return Response.json(thread);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { title, status } = await req.json();
  if (title) await threadRepository.updateThreadTitle(params.id, title);
  if (status === 'archived') await threadRepository.archiveThread(params.id);
  if (status === 'regular') await threadRepository.unarchiveThread(params.id);
  const thread = await threadRepository.getThread(params.id);
  return Response.json(thread);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await threadRepository.deleteThread(params.id);
  return new Response(null, { status: 204 });
} 