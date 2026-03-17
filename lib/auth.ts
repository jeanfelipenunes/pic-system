import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from './prisma';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
    include: { departamento: true },
  });
}

export function hasRole(userRole: string, required: string | string[]): boolean {
  const roles = Array.isArray(required) ? required : [required];
  const hierarchy: Record<string, number> = {
    usuario: 1,
    gestor: 2,
    executor: 2,
    admin: 99,
  };
  const userLevel = hierarchy[userRole] ?? 0;
  return roles.some((r) => userLevel >= (hierarchy[r] ?? 0));
}
