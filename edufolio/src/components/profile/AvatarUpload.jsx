import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function AvatarUpload({ avatarUrl, onUploaded }) {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    setError('');

    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      cacheControl: '3600'
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    await supabase.from('students').update({ avatar_url: publicUrl }).eq('id', user.id);

    setUploading(false);
    onUploaded?.(publicUrl);
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        data-cursor-hover
        onClick={() => inputRef.current?.click()}
        aria-label="Change avatar"
        className="group relative h-28 w-28 overflow-hidden rounded-full border-2 border-glass"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-midnight-elevated text-text-muted">
            <Camera size={26} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-midnight-deep/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera size={20} className="text-text-primary" />
        </div>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" aria-hidden="true" />
      {uploading && <p className="mt-2 text-xs text-text-muted">Uploading…</p>}
      {error && (
        <p role="alert" className="mt-2 text-xs text-status-error">
          {error}
        </p>
      )}
    </div>
  );
}
