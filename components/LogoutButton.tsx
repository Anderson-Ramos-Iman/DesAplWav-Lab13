'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/signIn' })}
      className="rounded bg-gray-600 px-4 py-2 text-white transition hover:bg-red-500"
    >
      Cerrar Sesión
    </button>
  );
}
