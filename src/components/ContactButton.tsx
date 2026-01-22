'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { ContactModal } from './ContactModal';

interface ContactButtonProps {
  className?: string;
  children?: React.ReactNode;
  subject?: string;
  prefilledMessage?: string;
}

export function ContactButton({
  className = '',
  children,
  subject = 'Záujem o alternatívne riešenie',
  prefilledMessage = ''
}: ContactButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {children || (
          <>
            <Mail className="h-4 w-4 md:h-5 md:w-5" />
            Kontaktujte nás
          </>
        )}
      </button>

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subject={subject}
        prefilledMessage={prefilledMessage}
      />
    </>
  );
}
