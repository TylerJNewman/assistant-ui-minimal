import { threadRepository } from '@/lib/db/operations';

export async function GET(req: Request) {
  const threads = await threadRepository.listThreads();
  return Response.json(threads);
}

export async function POST(req: Request) {
  const thread = await threadRepository.createThread();
  return Response.json(thread);
} 