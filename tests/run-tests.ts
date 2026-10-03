import { runAutomatedVerificationTests } from './verification-suite';

async function main() {
  console.log('====================================================');
  console.log('FundedShift Prop Firm Automated Backend Verification Suite');
  console.log('====================================================');

  const suite = await runAutomatedVerificationTests();

  console.log(`Executed: ${suite.totalTests} tests at ${suite.timestamp}`);
  console.log(`Passed:   ${suite.passed}`);
  console.log(`Failed:   ${suite.failed}`);
  console.log('----------------------------------------------------');

  for (const r of suite.results) {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} [${r.category}] ${r.name} (${r.durationMs}ms)`);
    if (!r.passed) {
      console.error(`   Error: ${r.message}`);
    }
  }

  console.log('====================================================');
  if (suite.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
