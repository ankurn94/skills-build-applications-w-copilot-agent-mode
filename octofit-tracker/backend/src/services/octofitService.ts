import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || typeof minutes !== 'number'
  ) {
    throw Object.assign(new Error('userId, teamId, type, and minutes are required'), { status: 400 });
  }

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('Invalid user or team ID'), { status: 400 });
  }

  if (!type.trim() || !Number.isFinite(minutes) || minutes < 0) {
    throw Object.assign(new Error('Invalid activity details'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);

  if (!user || !team) {
    throw Object.assign(new Error('User or team not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string')) {
    throw Object.assign(new Error('Team members must be user IDs'), { status: 400 });
  }

  const memberIds = members as string[];
  if (memberIds.some((memberId) => !mongoose.isValidObjectId(memberId))) {
    throw Object.assign(new Error('Invalid team member ID'), { status: 400 });
  }

  if (memberIds.length > 0) {
    const existingMembers = await User.find({
      _id: { $in: memberIds },
    }).select('_id').lean();
    if (existingMembers.length !== new Set(memberIds).size) {
      throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
    }
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);

  const teams = await Team.find({
    _id: { $in: totals.map((entry: { _id: unknown }) => entry._id) },
  }).lean();

  const teamsById = new Map(
    teams.map((team) => [team._id.toString(), team]),
  );

  return totals
    .map((entry: { _id: unknown; totalPoints: number }) => {
      const team = teamsById.get(String(entry._id));
      return team && typeof team.name === 'string'
        ? { teamName: team.name, totalPoints: entry.totalPoints }
        : null;
    })
    .filter((entry): entry is { teamName: string; totalPoints: number } => entry !== null)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .lean();

  const desiredFocus = user.fitnessGoal || recentActivity?.type;
  const matchedWorkout = desiredFocus
    ? await Workout.findOne({ focus: desiredFocus }).lean()
    : null;
  const workout = matchedWorkout || (recentActivity?.type
    ? await Workout.findOne({ focus: recentActivity.type }).lean()
    : null)
    || await Workout.findOne().lean();

  if (!workout) {
    return [];
  }

  const fitnessGoal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal : 'fitness';
  const recentType = typeof recentActivity?.type === 'string' ? recentActivity.type : 'activity';
  const reason = recentActivity
    ? `Recommended for ${fitnessGoal} based on your recent ${recentType} activity`
    : `Recommended for your ${fitnessGoal} goal`;

  return [{ ...workout, reason }];
}

export { User };
