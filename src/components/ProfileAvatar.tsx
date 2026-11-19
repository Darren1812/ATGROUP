'use client';

import { useEffect, useState } from 'react';

export default function ProfileAvatar({
  userId,
  name,
  version = 0,
  className = 'h-9 w-9',
  onClick,
  fit = 'cover',
  shape = 'circle',
}: {
  userId?: number;
  name: string;
  version?: number;
  className?: string;
  onClick?: () => void;
  fit?: 'cover' | 'contain';
  shape?: 'circle' | 'square';
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const onPhotoUpdated = (event: Event) => {
      const updatedUserId = (event as CustomEvent<{ userId: number }>).detail?.userId;
      if (updatedUserId === userId) setRefreshVersion((current) => current + 1);
    };
    window.addEventListener('profile-photo-updated', onPhotoUpdated);
    return () => window.removeEventListener('profile-photo-updated', onPhotoUpdated);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSrc(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ProfilePhotos/${userId}?v=${version + refreshVersion}`, {
      credentials: 'include',
    }).then(async (response) => {
      if (response.status === 204) {
        if (!cancelled) setSrc(null);
        return;
      }
      if (!response.ok) return;
      const image = await response.blob();
      if (!cancelled) {
        objectUrl = URL.createObjectURL(image);
        setSrc(objectUrl);
      }
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, version, refreshVersion]);

  if (src) {
    const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover';
    // Preserve and display the uploaded image blob directly, without Next image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    const image = <img src={src} alt={`${name} profile`} className={`${className} ${shape === 'circle' ? 'rounded-full' : 'rounded-xl'} ${fitClass} border border-slate-200`} />;
    return onClick ? (
      <button type="button" onClick={onClick} title="View profile photo" aria-label={`View ${name}'s profile photo`} className="inline-flex cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
        {image}
      </button>
    ) : image;
  }

  return (
    <div className={`${className} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs`} aria-label={`${name} profile photo unavailable`}>
      {name?.trim()?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}
