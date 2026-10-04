export const getMatchLevel = (percentage) => {
  if (percentage >= 80) return 'Strong Skill Match';
  if (percentage >= 60) return 'Good Skill Match';
  if (percentage >= 40) return 'Partial Skill Match';
  return 'Skills Need Development';
};

export const getUpgradeSkills = (roles = []) => {
  const seen = new Set();
  return roles.flatMap((role) => [...(role.required_missing || []), ...(role.preferred_missing || [])]).filter((skill) => {
    const key = skill.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getCategories = (roles = []) => ['All', ...new Set(roles.map((role) => role.category))];
