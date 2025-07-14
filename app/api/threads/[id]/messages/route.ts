import { threadRepository } from '@/lib/db/operations';
import { type NextRequest, NextResponse } from 'next/server';

const getThreadId = (req: NextRequest) => {
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  // The pathname is /api/threads/[id]/messages, so the id is the 3rd to last part
  return parts[parts.length - 2];
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = getThreadId(req);
  const messages = await threadRepository.getThreadMessages(id);
  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = getThreadId(req);
  const { role, content } = await req.json();
  const message = await threadRepository.createMessage({
    threadId: id,
    role,
    content,
  });
  return NextResponse.json(message);
} 