const test = require('node:test');
const assert = require('node:assert/strict');

const {
  evaluateFoodSafety,
  computeUrgency,
  computeDistanceScore,
  computePriorityScore,
  getRecommendedDonationPayload,
} = require('../services/foodSafetyService');

test('fresh food with good storage stays safe', () => {
  const result = evaluateFoodSafety({
    foodType: 'cooked',
    preparedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    storageMethod: 'refrigerated',
    currentStorageTemperature: 4,
    packagingCondition: 'sealed',
    foodAppearance: 'normal',
    odor: 'normal',
    contaminationRisk: 'none',
    hygiene: 'good',
  });

  assert.ok(result.score >= 80);
  assert.equal(result.status, 'SAFE');
  assert.equal(Array.isArray(result.reasons), true);
});

test('food close to expiry decreases score to caution', () => {
  const result = evaluateFoodSafety({
    foodType: 'cooked',
    preparedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    storageMethod: 'refrigerated',
    currentStorageTemperature: 5,
    packagingCondition: 'sealed',
    foodAppearance: 'normal',
    odor: 'normal',
    contaminationRisk: 'none',
    hygiene: 'good',
  });

  assert.ok(result.score < 80);
  assert.equal(result.status, 'CAUTION');
});

test('bad smell significantly penalizes safety', () => {
  const result = evaluateFoodSafety({
    foodType: 'cooked',
    preparedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    storageMethod: 'refrigerated',
    currentStorageTemperature: 6,
    packagingCondition: 'sealed',
    foodAppearance: 'normal',
    odor: 'unusual',
    contaminationRisk: 'none',
    hygiene: 'good',
  });

  assert.ok(result.score < 70);
  assert.equal(result.status, 'CAUTION');
});

test('known contamination makes food unsafe regardless of score', () => {
  const result = evaluateFoodSafety({
    foodType: 'raw',
    preparedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    storageMethod: 'refrigerated',
    currentStorageTemperature: 2,
    packagingCondition: 'sealed',
    foodAppearance: 'normal',
    odor: 'normal',
    contaminationRisk: 'known',
    hygiene: 'good',
  });

  assert.equal(result.status, 'UNSAFE');
  assert.ok(result.score <= 49);
});

test('expired food becomes unsafe and unavailable', () => {
  const result = evaluateFoodSafety({
    foodType: 'packaged',
    preparedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiryTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    storageMethod: 'room temperature',
    currentStorageTemperature: 24,
    packagingCondition: 'sealed',
    foodAppearance: 'normal',
    odor: 'normal',
    contaminationRisk: 'none',
    hygiene: 'good',
  });

  assert.equal(result.status, 'UNSAFE');
  assert.ok(result.score <= 49);
});

test('priority score matches urgency plus distance weighting', () => {
  const urgency = computeUrgency(new Date(Date.now() + 3 * 60 * 60 * 1000), new Date());
  const distanceScore = computeDistanceScore(3);
  const priority = computePriorityScore(urgency.score, distanceScore);

  assert.equal(priority, 88);
});

test('unsafe donation is not recommended simply because it is nearby', () => {
  const donation = {
    foodSafety: { status: 'UNSAFE', score: 20 },
    urgency: { score: 95 },
    distance: { km: 1.2, score: 100 },
  };

  const ranked = getRecommendedDonationPayload(donation, true);
  assert.equal(ranked.recommended, false);
  assert.equal(ranked.priorityScore, 0);
});
