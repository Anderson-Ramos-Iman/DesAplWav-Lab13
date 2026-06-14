import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signIn');
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            Dashboard
          </h1>

          <div className="mb-6">
            <p className="mb-2 text-gray-700">
              Bienvenido, <span className="font-semibold">{session.user?.name}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
