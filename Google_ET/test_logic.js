const RESTRICTED_START_1 = 0; // 00:00
const RESTRICTED_END_1 = 18 * 60; // 18:00
const RESTRICTED_START_2 = 20 * 60 + 30; // 20:30
const RESTRICTED_END_2 = 24 * 60; // 23:59 (approx)

function isRestrictedTime(hours, minutes) {
  const currentTimeInMinutes = hours * 60 + minutes;

  const isMorningRestriction = currentTimeInMinutes >= RESTRICTED_START_1 && currentTimeInMinutes < RESTRICTED_END_1;
  const isNightRestriction = currentTimeInMinutes >= RESTRICTED_START_2 && currentTimeInMinutes < RESTRICTED_END_2;

  return isMorningRestriction || isNightRestriction;
}

const testCases = [
    { h: 0, m: 0, expected: true },   // Midnight - Restricted
    { h: 8, m: 0, expected: true },   // 8:00 AM - Restricted
    { h: 17, m: 59, expected: true }, // 5:59 PM - Restricted
    { h: 18, m: 0, expected: false },  // 6:00 PM - Allowed
    { h: 19, m: 30, expected: false }, // 7:30 PM - Allowed
    { h: 20, m: 29, expected: false }, // 8:29 PM - Allowed
    { h: 20, m: 30, expected: true },  // 8:30 PM - Restricted
    { h: 23, m: 59, expected: true }   // 11:59 PM - Restricted
];

testCases.forEach(test => {
    const result = isRestrictedTime(test.h, test.m);
    console.log(`Time ${test.h}:${test.m.toString().padStart(2, '0')} -> Restricted: ${result} (Expected: ${test.expected})`);
    if (result !== test.expected) {
        console.error("FAIL!");
        process.exit(1);
    }
});
console.log("All tests passed!");
