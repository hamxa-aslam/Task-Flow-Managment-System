import fs from 'fs';
const path = 'frontend/src/Dashboard.jsx';
let c = fs.readFileSync(path, 'utf8');
const old = `  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">`;
const neu = `  return (
    <div className="relative min-h-screen text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1400px_circle_at_top,rgba(99,102,241,0.16),transparent_60%),radial-gradient(1000px_circle_at_80%_-10%,rgba(139,92,246,0.14),transparent_65%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]" />`;
if (c.includes(old)) {
  c = c.split(old).join(neu);
  fs.writeFileSync(path, c);
  console.log('patched');
} else {
  console.log('not found');
}
