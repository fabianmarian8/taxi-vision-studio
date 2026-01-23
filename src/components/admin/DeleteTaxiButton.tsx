'use client';

import { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteTaxiButtonProps {
  citySlug: string;
  serviceName: string;
  onDeleted?: () => void;
}

export function DeleteTaxiButton({ citySlug, serviceName, onDeleted }: DeleteTaxiButtonProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if user is admin on mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/check', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin === true && data.username === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch {
        // Not admin
      }
    };
    checkAdmin();
  }, []);

  if (!isAdmin) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/taxi-services/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citySlug,
          serviceName,
          reason: 'Removed by superadmin',
        }),
      });

      if (res.ok) {
        setShowConfirm(false);
        onDeleted?.();
        // Refresh page to show updated list
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Nepodarilo sa zmazať');
      }
    } catch {
      alert('Chyba pri mazaní');
    } finally {
      setIsDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
        <span className="text-sm text-red-700">Naozaj zmazať?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Áno'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Nie
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
      title="Zmazať taxislužbu (admin)"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
