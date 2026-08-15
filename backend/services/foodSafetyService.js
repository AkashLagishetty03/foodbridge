const FOOD_TYPE_OPTIONS = ['cooked', 'raw', 'packaged', 'bakery', 'fruits-vegetables', 'dairy', 'other'];
const STORAGE_METHODS = ['refrigerated', 'frozen', 'room temperature', 'hot-held', 'other'];
const PACKAGING_OPTIONS = ['sealed', 'properly covered', 'partially damaged', 'open'];
const APPEARANCE_OPTIONS = ['normal', 'slightly changed', 'clearly abnormal'];
const ODOR_OPTIONS = ['normal', 'slightly unusual', 'unusual'];
const CONTAMINATION_OPTIONS = ['none', 'possible', 'known'];
const HYGIENE_OPTIONS = ['good', 'acceptable', 'poor'];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeDate = (value) => {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildSafeTemperatureRange = (storageMethod) => {
  if (storageMethod === 'refrigerated') return { min: 1, max: 7 };
  if (storageMethod === 'frozen') return { min: -18, max: -12 };
  if (storageMethod === 'hot-held') return { min: 60, max: 65 };
  if (storageMethod === 'room temperature') return { min: 15, max: 25 };
  return null;
};

const evaluateFoodSafety = (input = {}) => {
  const now = new Date();
  let score = 100;
  const reasons = [];

  const expiryTime = normalizeDate(input.expiryTime);
  const preparedAt = normalizeDate(input.preparedAt || input.preparationTime || input.foodAgeAt || input.createdAt || null);
  const foodType = FOOD_TYPE_OPTIONS.includes(input.foodType) ? input.foodType : 'other';
  const storageMethod = STORAGE_METHODS.includes(input.storageMethod) ? input.storageMethod : 'room temperature';
  const packagingCondition = PACKAGING_OPTIONS.includes(input.packagingCondition) ? input.packagingCondition : 'sealed';
  const foodAppearance = APPEARANCE_OPTIONS.includes(input.foodAppearance) ? input.foodAppearance : 'normal';
  const odor = ODOR_OPTIONS.includes(input.odor) ? input.odor : 'normal';
  const contaminationRisk = CONTAMINATION_OPTIONS.includes(input.contaminationRisk) ? input.contaminationRisk : 'none';
  const hygiene = HYGIENE_OPTIONS.includes(input.hygiene) ? input.hygiene : 'good';

  if (!expiryTime) {
    score -= 25;
    reasons.push('Expiry time is missing or invalid');
  } else if (expiryTime < now) {
    score = 0;
    reasons.push('Food is past its expiry time');
  } else {
    const remainingHours = (expiryTime - now) / (1000 * 60 * 60);
    if (remainingHours <= 2) {
      score -= 50;
      reasons.push('Food is close to its expiry time');
    } else if (remainingHours <= 6) {
      score -= 25;
      reasons.push('Food is close to expiry');
    } else if (remainingHours <= 12) {
      score -= 15;
      reasons.push('Food is nearing expiry');
    }
  }

  if (preparedAt && expiryTime) {
    const ageHours = (now - preparedAt) / (1000 * 60 * 60);
    if (ageHours > 72) {
      score -= 15;
      reasons.push('Food age exceeds the recommended holding window');
    }
  }

  const tempValue = toNumber(input.currentStorageTemperature);
  if (tempValue !== null) {
    const safeRange = buildSafeTemperatureRange(storageMethod);
    if (safeRange && (tempValue < safeRange.min || tempValue > safeRange.max)) {
      score -= 20;
      reasons.push('Current storage temperature is outside the safe range');
    }
  } else if (storageMethod !== 'other' && storageMethod !== 'room temperature') {
    score -= 10;
    reasons.push('Storage temperature is missing');
  }

  const packagingPenaltyMap = {
    sealed: 0,
    'properly covered': 5,
    'partially damaged': 10,
    open: 20,
  };
  if (packagingCondition && packagingPenaltyMap[packagingCondition] > 0) {
    score -= packagingPenaltyMap[packagingCondition];
    reasons.push('Packaging is not fully intact');
  }

  const appearancePenaltyMap = {
    normal: 0,
    'slightly changed': 10,
    'clearly abnormal': 15,
  };
  if (appearancePenaltyMap[foodAppearance] > 0) {
    score -= appearancePenaltyMap[foodAppearance];
    reasons.push('Food appearance is not normal');
  }

  const odorPenaltyMap = {
    normal: 0,
    'slightly unusual': 10,
    unusual: 20,
  };
  if (odorPenaltyMap[odor] > 0) {
    score -= odorPenaltyMap[odor];
    reasons.push('Odor is unusual or unpleasant');
  }

  const contaminationPenaltyMap = {
    none: 0,
    possible: 30,
    known: 100,
  };
  if (contaminationPenaltyMap[contaminationRisk] > 0) {
    score -= contaminationPenaltyMap[contaminationRisk];
    if (contaminationRisk === 'known') {
      reasons.push('Known contamination risk');
    } else {
      reasons.push('Possible contamination risk');
    }
  }

  const hygienePenaltyMap = {
    good: 0,
    acceptable: 10,
    poor: 15,
  };
  if (hygienePenaltyMap[hygiene] > 0) {
    score -= hygienePenaltyMap[hygiene];
    reasons.push('Food handling hygiene is below ideal standards');
  }

  if (foodType === 'raw' && storageMethod === 'room temperature' && tempValue !== null && tempValue > 25) {
    score -= 10;
    reasons.push('Raw food is being held above a safe ambient range');
  }

  if (contaminationRisk === 'known') {
    score = 0;
    reasons.push('Known contamination makes the food unsafe');
  }

  const finalScore = clamp(Math.round(score), 0, 100);
  let status = 'SAFE';
  if (finalScore < 50 || (contaminationRisk === 'known') || expiryTime < now) {
    status = 'UNSAFE';
  } else if (finalScore < 80) {
    status = 'CAUTION';
  }

  return {
    score: finalScore,
    status,
    reasons: [...new Set(reasons)].slice(0, 6),
    evaluatedAt: new Date().toISOString(),
  };
};

const computeUrgency = (expiryTime, now = new Date()) => {
  const expiry = normalizeDate(expiryTime);
  if (!expiry) {
    return { score: 0, level: 'LOW', remainingHours: 0 };
  }

  const remainingMs = expiry.getTime() - now.getTime();
  const remainingHours = remainingMs / (1000 * 60 * 60);

  if (remainingHours <= 0) {
    return { score: 0, level: 'CRITICAL', remainingHours: 0 };
  }

  let score;
  let level;

  if (remainingHours <= 2) {
    score = 100;
    level = 'CRITICAL';
  } else if (remainingHours <= 6) {
    score = 90;
    level = 'HIGH';
  } else if (remainingHours <= 12) {
    score = 75;
    level = 'HIGH';
  } else if (remainingHours <= 24) {
    score = 60;
    level = 'MEDIUM';
  } else if (remainingHours <= 48) {
    score = 40;
    level = 'MEDIUM';
  } else if (remainingHours <= 72) {
    score = 20;
    level = 'LOW';
  } else {
    score = 5;
    level = 'LOW';
  }

  return { score, level, remainingHours: Number(remainingHours.toFixed(2)) };
};

const computeDistanceKm = (fromLat, fromLng, toLat, toLng) => {
  if (
    fromLat === null || fromLat === undefined || fromLng === null || fromLng === undefined ||
    toLat === null || toLat === undefined || toLng === null || toLng === undefined ||
    Number.isNaN(Number(fromLat)) || Number.isNaN(Number(fromLng)) || Number.isNaN(Number(toLat)) || Number.isNaN(Number(toLng))
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(Number(toLat) - Number(fromLat));
  const dLng = toRad(Number(toLng) - Number(fromLng));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(fromLat))) * Math.cos(toRad(Number(toLat))) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const computeDistanceScore = (distanceKm) => {
  const distance = Number(distanceKm);
  if (!Number.isFinite(distance)) return 0;
  if (distance <= 2) return 100;
  if (distance <= 5) return 85;
  if (distance <= 10) return 65;
  if (distance <= 20) return 40;
  if (distance <= 30) return 20;
  return 5;
};

const computePriorityScore = (urgencyScore, distanceScore) => {
  const urgency = clamp(Number(urgencyScore) || 0, 0, 100);
  const distance = clamp(Number(distanceScore) || 0, 0, 100);
  return clamp(Math.round((urgency * 0.6) + (distance * 0.4)), 0, 100);
};

const getRecommendedDonationPayload = (donation = {}, includeReason = false) => {
  const safetyStatus = donation.foodSafety?.status || 'SAFE';
  if (safetyStatus === 'UNSAFE') {
    return {
      recommended: false,
      priorityScore: 0,
      reason: includeReason ? 'Unsafe donation is automatically deprioritized' : undefined,
    };
  }

  const urgencyScore = Number(donation.urgency?.score || 0);
  const distanceScore = Number(donation.distance?.score || 0);
  const priorityScore = computePriorityScore(urgencyScore, distanceScore);

  return {
    recommended: true,
    priorityScore,
    reason: includeReason ? 'Safe donation sorted by urgency and nearby distance' : undefined,
  };
};

module.exports = {
  FOOD_TYPE_OPTIONS,
  STORAGE_METHODS,
  PACKAGING_OPTIONS,
  APPEARANCE_OPTIONS,
  ODOR_OPTIONS,
  CONTAMINATION_OPTIONS,
  HYGIENE_OPTIONS,
  evaluateFoodSafety,
  computeUrgency,
  computeDistanceKm,
  computeDistanceScore,
  computePriorityScore,
  getRecommendedDonationPayload,
};
