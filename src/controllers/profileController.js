import { getAllProfiles, createProfile, getProfileByUsername } from '../config/profileService.js';

export const getProfiles = async (req, res) => {
  try {
    const profiles = await getAllProfiles();
    
    const transformedProfiles = profiles.map(profile => ({
      name: profile.displayname,
      username: profile.username,
      bio: profile.bio,
      acceptedCryptos: profile.tags ? profile.tags.split(',').map(tag => tag.trim()) : []
    }));
    res.json(transformedProfiles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};

export const createNewProfile = async (req, res) => {
  const { name, bio, acceptedCryptos } = req.body;

  // Get username from session
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }

  const username = req.session.user.username;
  if (!username) {
    return res.status(400).json({ success: false, message: 'User account missing username. Please contact support.' });
  }

  try {
    // Check if username already exists
    const existingProfile = await getProfileByUsername(username);
    if (existingProfile) {
      return res.status(400).json({ success: false, message: 'Profile already exists for this user' });
    }

    // Convert acceptedCryptos array to comma-separated string
    const tags = acceptedCryptos.join(',');

    await createProfile(username, name, tags, '', bio); // addresses empty for now
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create profile' });
  }
};