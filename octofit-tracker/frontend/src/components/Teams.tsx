import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name?: string;
  mascot?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Unable to load teams');
      });
  }, []);

  let content;
  if (error) {
    content = <p role="alert">Unable to load teams: {error}</p>;
  } else if (teams === null) {
    content = <p role="status">Loading teams...</p>;
  } else if (teams.length === 0) {
    content = <p>No teams found.</p>;
  } else {
    content = (
      <ul>
        {teams.map((team, index) => (
          <li key={team.name || index}>
            {team.name || 'Team'}
            {team.mascot ? ` - ${team.mascot}` : ''}
            {team.members ? ` - ${team.members.length} members` : ''}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {content}
    </CapabilityCard>
  );
}
