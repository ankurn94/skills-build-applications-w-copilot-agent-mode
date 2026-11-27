import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Unable to load leaderboard');
      });
  }, []);

  let content;
  if (error) {
    content = <p role="alert">Unable to load leaderboard: {error}</p>;
  } else if (leaderboard === null) {
    content = <p role="status">Loading leaderboard...</p>;
  } else if (leaderboard.length === 0) {
    content = <p>No leaderboard rankings available.</p>;
  } else {
    content = (
      <ol>
        {leaderboard.map((entry, index) => (
          <li key={entry.rank || index}>
            {entry.teamName || 'Team'}
            {entry.totalPoints !== undefined ? ` - ${entry.totalPoints} points` : ''}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {content}
    </CapabilityCard>
  );
}
