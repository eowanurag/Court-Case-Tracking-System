// Utility to generate formatted numbers for files and FIRs

const getSectorCode = (sector) => {
  if (!sector) return 'oth';
  const map = {
    'Lucknow': 'lko',
    'Kanpur': 'knp',
    'Meerut': 'mrt',
    'Varanasi': 'vns',
    'Headquater': 'hq',
    'SSIT': 'ssit',
    'Special Cell': 'spl'
  };
  return map[sector] || sector.substring(0, 3).toLowerCase();
};

const generateFullFileNo = (fileNo, fileYear) => {
  // Format: 045/2026
  return `${fileNo}/${fileYear}`;
};

const generateFullFirNo = (firNo, firYear) => {
  // Format: 1024/2026
  return `${firNo}/${firYear}`;
};

module.exports = {
  generateFullFileNo,
  generateFullFirNo
};
