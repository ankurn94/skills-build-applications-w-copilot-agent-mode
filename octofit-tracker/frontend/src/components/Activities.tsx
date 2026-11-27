import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Unable to load activities');
      });
  }, []);

  let content: ReactNode;
  if (error) {
    content = <p role="alert">Unable to load activities: {error}</p>;
  } else if (activities === null) {
    content = <p role="status">Loading activities...</p>;
  } else if (activities.length === 0) {
    content = <p>No activities found.</p>;
  } else {
    content = (
      <ul>
        {activities.map((activity, index) => (
          <li key={index}>
            {activity.type || 'Activity'}
            {activity.minutes !== undefined ? ` - ${activity.minutes} minutes` : ''}
            {activity.points !== undefined ? ` - ${activity.points} points` : ''}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {content}
    </CapabilityCard>
  );
}
