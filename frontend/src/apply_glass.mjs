import fs from 'fs';
const files = [
  'frontend/src/components/ProjectsView.jsx',
  'frontend/src/components/UsersView.jsx',
  'frontend/src/components/TaskTable.jsx',
];
for (const p of files) {
  try {
    let c = fs.readFileSync(p, 'utf8');
    if (c.includes('animate-fade-in')) continue;
    c = c.replace(/<div className="space-y-6">/, '<div className="space-y-6 animate-fade-in">');
    c = c.replace(/<div className='space-y-6'>/, "<div className='space-y-6 animate-fade-in'>");
    c = c.replace(/<div className="space-y-5">/, '<div className="space-y-5 animate-fade-in">');
    fs.writeFileSync(p, c);
    console.log('ok', p);
  } catch(e) { console.log('err', p, e.message); }
}
