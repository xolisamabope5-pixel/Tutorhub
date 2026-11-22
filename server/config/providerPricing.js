// TutorHub provider subscription pricing (ZAR/month).
// These are the current launch prices; adjust this file when the platform
// pricing is formally changed. The server always calculates the amount.
const CENTRE_TIERS = [
  { maxLearners: 15, fee: 300 },
  { maxLearners: 30, fee: 600 },
  { maxLearners: 60, fee: 1000 },
  { maxLearners: 90, fee: 1500 }
];
const PRIVATE_TUTOR_MONTHLY_FEE = 150;

function quoteProviderFee(providerType, learnerCount) {
  if (providerType === 'private-tutor') {
    return { fee: PRIVATE_TUTOR_MONTHLY_FEE, customQuoteRequired: false, label: 'Independent private tutor' };
  }
  const count = Number(learnerCount);
  if (!Number.isInteger(count) || count < 1) throw new Error('Enter a valid number of learners.');
  const tier = CENTRE_TIERS.find(item => count <= item.maxLearners);
  if (!tier) return { fee: null, customQuoteRequired: true, label: 'Custom quote required for more than 90 learners' };
  return { fee: tier.fee, customQuoteRequired: false, label: `Up to ${tier.maxLearners} learners` };
}
module.exports = { quoteProviderFee, CENTRE_TIERS, PRIVATE_TUTOR_MONTHLY_FEE };
