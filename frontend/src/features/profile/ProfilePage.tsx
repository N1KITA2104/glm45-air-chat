import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';

import { updateProfile } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import '../../styles/profile.css';

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setMessage('Profile updated successfully.');
    },
    onError: (error) => {
      console.error(error);
      setMessage('Unable to update profile. Please try again.');
    },
  });

  if (!user) {
    return (
      <div className="profile-container">
        <p>You need to be signed in.</p>
        <Link to="/">Back to chats</Link>
      </div>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    mutation.mutate({ display_name: displayName });
  };

  return (
    <div className="profile-container">
      <header>
        <h1>Profile</h1>
        <Link to="/">← Back to chats</Link>
      </header>
      <form onSubmit={handleSubmit}>
        <label htmlFor="profile-email">Email</label>
        <input id="profile-email" value={user.email} disabled />

        <label htmlFor="profile-display-name">Display name</label>
        <input
          id="profile-display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
        />

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
      {message ? <p className="profile-message">{message}</p> : null}
    </div>
  );
};

