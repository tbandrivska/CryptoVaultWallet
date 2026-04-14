import { getAllProfiles, createProfile, getProfileByUsername } from '../config/profileService.js';

export const getProfiles = async (req, res) => {
  try {
    const profiles = await getAllProfiles();
    const transformed = profiles.map(profile => ({
      name: profile.displayname,
      username: profile.username,
      bio: profile.bio,
      acceptedCryptos: profile.tags ? profile.tags.split(',').map(t => t.trim()) : []
    }));
    res.json(transformed);
  } catch (err) {
    console.error('getProfiles error:', err);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};

export const createNewProfile = async (req, res) => {
  const { name, bio, acceptedCryptos } = req.body;

  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }

  const username = req.session.user.username;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Your account has no username — please re-register.' });
  }

  if (!name || !bio || !acceptedCryptos?.length) {
    return res.status(400).json({ success: false, message: 'Name, bio and at least one crypto are required.' });
  }

  try {
    const existing = await getProfileByUsername(username);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a public profile.' });
    }
    const tags = Array.isArray(acceptedCryptos) ? acceptedCryptos.join(',') : acceptedCryptos;
    await createProfile(username, name, tags, '', bio);
    res.json({ success: true, message: 'Profile created!' });
  } catch (err) {
    console.error('createNewProfile error:', err.message);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
};