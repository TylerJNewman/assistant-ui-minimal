import { threadRepository } from '@/lib/db/operations';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const messages = await threadRepository.getThreadMessages(params.id);
  return Response.json(messages);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { role, content } = await req.json();
  const message = await threadRepository.createMessage({
    threadId: params.id,
    role,
    content,
  });
  return Response.json(message);
} 