import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  minutes?: number;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const userEmail = 'mona@example.com';
    getJson<{ suggestions: WorkoutSuggestion[] }>(
      `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`,
    )
      .then((data) => setSuggestions(data.suggestions))
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Unable to load workout suggestions');
      });
  }, []);

  let content;
  if (error) {
    content = <p role="alert">Unable to load workout suggestions: {error}</p>;
  } else if (suggestions === null) {
    content = <p role="status">Loading workout suggestions...</p>;
  } else if (suggestions.length === 0) {
    content = <p>No workout suggestions available.</p>;
  } else {
    content = (
      <ul>
        {suggestions.map((suggestion, index) => (
          <li key={suggestion.title || index}>
            <strong>{suggestion.title || 'Workout'}</strong>
            {suggestion.focus ? ` - ${suggestion.focus}` : ''}
            {suggestion.minutes !== undefined ? ` - ${suggestion.minutes} minutes` : ''}
            {suggestion.reason ? `: ${suggestion.reason}` : ''}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {content}
    </CapabilityCard>
  );
}
