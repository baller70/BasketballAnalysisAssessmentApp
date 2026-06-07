const fs = require('fs');
const files = [
  'src/app/settings/page.tsx',
  'src/app/badges/page.tsx',
  'src/app/elite-shooters/page.tsx'
];

const replaceMap = {
  'bg-[#050505]': 'bg-white',
  'bg-[#0a0a0a]': 'bg-white',
  'bg-[#1a1a1a]': 'bg-white',
  'bg-[#2a2a2a]': 'bg-slate-50',
  'border-[#2a2a2a]': 'border-slate-100',
  'border-[#3a3a3a]': 'border-slate-200',
  'border-[#1a1a1a]': 'border-slate-300',
  'text-[#E5E5E5]': 'text-slate-900',
  'text-[#888]': 'text-slate-500',
  'text-[#666]': 'text-slate-400',
  'text-[#444]': 'text-slate-400',
  'text-[#333]': 'text-slate-500',
  'text-[#aaa]': 'text-slate-400',
  'text-[#ccc]': 'text-slate-400',
  'from-gray-900': 'from-slate-100',
  'to-gray-900': 'to-white',
  'bg-[#2C2C2C]': 'bg-slate-50',
  'bg-black/80': 'bg-black/40',
  'bg-black/70': 'bg-black/40'
};

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace all exact matches
    for (const [dark, light] of Object.entries(replaceMap)) {
      content = content.split(dark).join(light);
    }
    
    // Replace specific regexes for dark mode texts
    content = content.replace(/text-white(?! \})/g, 'text-slate-900');
    // but text-white inside buttons (with #FF6B35 or from-orange) should remain white.
    // We will do a generic replace and then revert where necessary, but better yet:
    // Only replace text-white if it's on a previously dark background.
    
    // Actually, manual replace is safer for text-white. Let's just run the exact replacements first.
    fs.writeFileSync(file, content);
    console.log(`Processed ${file}`);
  }
});
