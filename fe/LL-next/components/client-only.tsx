'use client';

import Providers from '@/app/contexts/providers';
import { Session } from 'next-auth';

const ClientOnly = ({ children, session }: { children: React.ReactNode; session: Session | null }) => {
  return <Providers session={session}>{children}</Providers>;
};

export default ClientOnly;
