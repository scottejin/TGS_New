const fs = require('fs/promises');

module.exports = async function msiProjectCreated(projectFile) {
  let wxs = await fs.readFile(projectFile, 'utf8');

  // Work around WiX linker failure when shortcuts reference an icon but no Icon element exists.
  if (!/<Icon Id="/.test(wxs)) {
    wxs = wxs.replace(/\sIcon="[^"]+"/g, '');
  }

  await fs.writeFile(projectFile, wxs, 'utf8');
};
