import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Image from 'next/image';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signIn');
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            Profile
          </h1>

          <div className="mb-6">
            <p className="mb-2 text-gray-700">
              Name: <span className="font-semibold">{session.user?.name}</span>
            </p>
            <p className="mb-2 text-gray-700">
              Email: <span className="font-semibold">{session.user?.email}</span>
            </p>

            {session.user?.image && (
              <>
                <p className="mb-2 text-gray-700">
                  Image Profile:
                </p>
                <Image
                  height={100}
                  width={100}
                  src={session.user.image}
                  alt="Profile"
                  className="mt-4 h-16 w-16 rounded-full"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
