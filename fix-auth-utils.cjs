const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('/mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src');

let modifiedCount = 0;

files.forEach(file => {
    let original = fs.readFileSync(file, 'utf8');
    let content = original;

    // We only care about synchronous destructuring.
    // e.g. const { data: { session } } = getCurrentSession();
    // We replace `= getCurrentSession(` with `= await getCurrentSession(`
    // BUT only if it is NOT already preceded by `await `.
    // A simple regex: replace any "=" followed by spaces and "getCurrentSession" with "= await getCurrentSession"
    content = content.replace(/=\s*getCurrentSession\(/g, '= await getCurrentSession(');
    content = content.replace(/=\s*getCurrentUser\(/g, '= await getCurrentUser(');

    // Some places might have `(getCurrentSession()).data.session`
    content = content.replace(/\(getCurrentSession\(\)\)/g, '(await getCurrentSession())');
    content = content.replace(/\(getCurrentUser\(\)\)/g, '(await getCurrentUser())');

    // Make sure we didn't accidentally make things like `const fn = getCurrentSession;` awaited (though our regex checks for parens).
    // And if there was already `await await`, fix it.
    content = content.replace(/await\s+await\s+getCurrentSession/g, 'await getCurrentSession');
    content = content.replace(/await\s+await\s+getCurrentUser/g, 'await getCurrentUser');

    if (content !== original) {
        fs.writeFileSync(file, content);
        modifiedCount++;
    }
});

console.log(`Modified ${modifiedCount} files.`);
