const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '_extracted_data.js'), 'utf8');
// eslint-disable-next-line no-new-func
const scope = {};
new Function('scope', src + '\nscope.CATEGORIES=CATEGORIES;scope.QUIZZES=QUIZZES;scope.WORDLE_WORDS=WORDLE_WORDS;scope.TRANSFER_CLUBS=TRANSFER_CLUBS;scope.TRANSFER_LINKS=TRANSFER_LINKS;scope.POINTS_BY_DIFFICULTY=POINTS_BY_DIFFICULTY;')(scope);

const { QUIZZES, WORDLE_WORDS, TRANSFER_CLUBS, TRANSFER_LINKS, POINTS_BY_DIFFICULTY } = scope;

function sqlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}
function sqlArr(arr) {
  return `ARRAY[${arr.map(sqlStr).join(', ')}]`;
}

let out = [];

out.push('-- quizzes');
for (const q of QUIZZES) {
  const points = POINTS_BY_DIFFICULTY[q.difficulty];
  out.push(
    `insert into public.quizzes (id, category, difficulty, title, description, image, image_credit, points) values (${sqlStr(q.id)}, ${sqlStr(q.category)}, ${sqlStr(q.difficulty)}, ${sqlStr(q.title)}, ${sqlStr(q.desc)}, ${sqlStr(q.image)}, ${sqlStr(q.imageCredit)}, ${points});`
  );
}

out.push('\n-- quiz_questions');
for (const q of QUIZZES) {
  q.questions.forEach((qq, i) => {
    const optionsJson = JSON.stringify(qq.options);
    out.push(
      `insert into public.quiz_questions (quiz_id, position, question, options, correct_index) values (${sqlStr(q.id)}, ${i}, ${sqlStr(qq.q)}, ${sqlStr(optionsJson)}::jsonb, ${qq.answer});`
    );
  });
}

out.push('\n-- wordle_puzzles');
for (const w of WORDLE_WORDS) {
  out.push(
    `insert into public.wordle_puzzles (id, word, label, hint) values (${sqlStr(w.id)}, ${sqlStr(w.word)}, ${sqlStr(w.label)}, ${sqlStr(w.hint)});`
  );
}

out.push('\n-- transfer_clubs');
for (const c of TRANSFER_CLUBS) {
  out.push(
    `insert into public.transfer_clubs (id, name, short_name) values (${sqlStr(c.id)}, ${sqlStr(c.name)}, ${sqlStr(c.shortName)});`
  );
}

out.push('\n-- transfer_links');
TRANSFER_LINKS.forEach((l, i) => {
  out.push(
    `insert into public.transfer_links (position, club_ids, answers, display) values (${i}, ${sqlArr(l.clubs)}, ${sqlArr(l.answers)}, ${sqlStr(l.display)});`
  );
});

fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '0002_seed.sql'), out.join('\n') + '\n');
console.log('wrote', out.length, 'statements');
console.log('quizzes:', QUIZZES.length, 'questions:', QUIZZES.reduce((s,q)=>s+q.questions.length,0), 'wordle:', WORDLE_WORDS.length, 'clubs:', TRANSFER_CLUBS.length, 'links:', TRANSFER_LINKS.length);
