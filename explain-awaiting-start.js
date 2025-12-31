const now = new Date();
console.log('\n=== CURRENT TIME ===');
console.log('Now:', now.toISOString());
console.log('');

console.log('=== FINAL STRIKE TIMES ===');
const startAt = new Date('2026-01-02T07:20:00+00:00');
const regCloseAt = new Date('2026-01-02T07:05:00+00:00');

console.log('Competition starts:', startAt.toISOString());
console.log('Registration closes:', regCloseAt.toISOString());
console.log('');

console.log('=== TIME CALCULATIONS ===');
const hoursUntilRegClose = (regCloseAt - now) / (1000 * 60 * 60);
const hoursUntilStart = (startAt - now) / (1000 * 60 * 60);

console.log(`Hours until reg close: ${hoursUntilRegClose.toFixed(2)}`);
console.log(`Hours until start: ${hoursUntilStart.toFixed(2)}`);
console.log('');

console.log('=== STATUS CHECKS ===');
console.log(`now >= regCloseAt? ${now >= regCloseAt} (is reg closed?)`);
console.log(`now < startAt? ${now < startAt} (has comp not started?)`);
console.log('');

console.log('=== CORRECT BEHAVIOR ===');
if (now >= regCloseAt && now < startAt) {
  console.log('✅ Show: "AWAITING START"');
  console.log('   Reason: Registration closed, but competition hasn\'t started yet');
  console.log('   Countdown: Shows time until competition starts');
} else if (now >= startAt) {
  console.log('✅ Show: "LIVE"');
  console.log('   Reason: Competition has started');
} else if (now < regCloseAt) {
  console.log('✅ Show: "REGISTRATION OPEN"');
  console.log('   Reason: Registration is still open');
  console.log(`   Countdown: Shows time until registration closes (${hoursUntilRegClose.toFixed(1)} hours)`);
}
console.log('');

console.log('=== WHY "TBA" COUNTDOWN? ===');
console.log('If countdown shows TBA, check:');
console.log('1. Is reg_close_at being passed to useCountdown hook?');
console.log('2. Is the date string properly formatted?');
console.log('   reg_close_at should be: "2026-01-02T07:05:00+00:00"');
console.log('   start_at should be: "2026-01-02T07:20:00+00:00"');
