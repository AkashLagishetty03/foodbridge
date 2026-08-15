const Food = require('../models/Food');
const Request = require('../models/Request');
const { AppError } = require('../middleware/errorMiddleware');
const {
  evaluateFoodSafety,
  computeUrgency,
  computeDistanceKm,
  computeDistanceScore,
  computePriorityScore,
  getRecommendedDonationPayload,
} = require('./foodSafetyService');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getExpiryFilter = ({ expiryWithinHours, expiryFrom, expiryTo, expiry }) => {
  const now = new Date();
  const filter = {};

  if (expiry === 'expired') {
    filter.$lt = now;
  } else if (expiry === 'today') {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    filter.$gte = now;
    filter.$lte = end;
  } else if (expiry === 'tomorrow') {
    const start = new Date(now);
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    filter.$gte = start;
    filter.$lte = end;
  } else {
    const hours = toNumber(expiryWithinHours);
    if (hours && hours > 0) {
      filter.$gte = now;
      filter.$lte = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
  }

  if (expiryFrom) {
    const from = new Date(expiryFrom);
    if (!Number.isNaN(from.getTime())) filter.$gte = from;
  }

  if (expiryTo) {
    const to = new Date(expiryTo);
    if (!Number.isNaN(to.getTime())) filter.$lte = to;
  }

  return Object.keys(filter).length ? filter : null;
};

const buildFoodFilter = (query = {}, base = {}) => {
  const { status, category } = query;
  const filter = { ...base };

  if (status) filter.status = status;
  if (category) filter.category = category;

  const expiryFilter = getExpiryFilter(query);
  if (expiryFilter) filter.expiryTime = expiryFilter;

  return filter;
};

const attachDerivedMetrics = (food, ngoLocation = null) => {
  const listing = food.toObject ? food.toObject() : { ...food };
  const baseInput = {
    ...listing,
    expiryTime: listing.expiryTime,
    preparedAt: listing.preparedAt || listing.preparationTime || listing.createdAt,
    foodType: listing.foodType || listing.category || 'other',
    storageMethod: listing.storageMethod || 'room temperature',
    packagingCondition: listing.packagingCondition || 'sealed',
    foodAppearance: listing.foodAppearance || 'normal',
    odor: listing.odor || 'normal',
    contaminationRisk: listing.contaminationRisk || 'none',
    hygiene: listing.hygiene || 'good',
  };

  const foodSafety = listing.foodSafety && listing.foodSafety.score !== undefined
    ? listing.foodSafety
    : evaluateFoodSafety(baseInput);

  const urgency = computeUrgency(listing.expiryTime, new Date());

  let distanceKm = null;
  let distanceScore = 0;

  if (ngoLocation && typeof ngoLocation.lat === 'number' && typeof ngoLocation.lng === 'number' && typeof listing.location?.lat === 'number' && typeof listing.location?.lng === 'number') {
    distanceKm = computeDistanceKm(ngoLocation.lat, ngoLocation.lng, listing.location.lat, listing.location.lng);
    distanceScore = computeDistanceScore(distanceKm);
  } else if (listing.distance?.km !== undefined && listing.distance?.km !== null) {
    distanceKm = Number(listing.distance.km);
    distanceScore = Number(listing.distance.score || computeDistanceScore(distanceKm));
  }

  const priorityScore = foodSafety.status === 'UNSAFE' ? 0 : computePriorityScore(urgency.score, distanceScore);
  const recommended = foodSafety.status !== 'UNSAFE' && priorityScore > 0;

  return {
    ...listing,
    foodSafety: {
      score: Math.max(0, Math.min(100, Number(foodSafety.score) || 0)),
      status: foodSafety.status || 'SAFE',
      reasons: Array.isArray(foodSafety.reasons) ? foodSafety.reasons : [],
      evaluatedAt: foodSafety.evaluatedAt || new Date().toISOString(),
    },
    urgency: {
      score: urgency.score,
      level: urgency.level,
      evaluatedAt: new Date().toISOString(),
    },
    distance: {
      km: distanceKm,
      score: distanceScore,
      evaluatedAt: new Date().toISOString(),
    },
    priority: {
      score: priorityScore,
      evaluatedAt: new Date().toISOString(),
    },
    recommended,
  };
};

const applyDistanceFilter = (foods, query = {}) => {
  const lat = toNumber(query.lat);
  const lng = toNumber(query.lng);
  const radiusKm = toNumber(query.radiusKm);

  if (lat === null || lng === null) return foods;

  return foods
    .map((food) => {
      const listing = attachDerivedMetrics(food, { lat, lng });
      const distance = Number(listing.distance?.km);
      return { ...listing, distanceKm: Number.isFinite(distance) ? distance : null };
    })
    .filter((food) => radiusKm === null || radiusKm <= 0 || (food.distanceKm !== null && food.distanceKm <= radiusKm));
};

const sortFoods = (foods, sortBy) => {
  const items = [...foods];

  if (sortBy === 'expiry') {
    return items.sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));
  }

  if (sortBy === 'distance' || sortBy === 'nearest') {
    return items.sort((a, b) => (Number(a.distance?.km ?? Number.MAX_SAFE_INTEGER)) - (Number(b.distance?.km ?? Number.MAX_SAFE_INTEGER)));
  }

  if (sortBy === 'safety' || sortBy === 'highest-safety') {
    return items.sort((a, b) => (Number(b.foodSafety?.score ?? 0)) - (Number(a.foodSafety?.score ?? 0)));
  }

  if (sortBy === 'recommended' || sortBy === 'priority') {
    return items.sort((a, b) => (Number(b.priority?.score ?? 0)) - (Number(a.priority?.score ?? 0)));
  }

  if (sortBy === 'urgent' || sortBy === 'most-urgent') {
    return items.sort((a, b) => (Number(b.urgency?.score ?? 0)) - (Number(a.urgency?.score ?? 0)));
  }

  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const paginate = (items, page, limit) => {
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
  const start = (parsedPage - 1) * parsedLimit;

  return {
    items: items.slice(start, start + parsedLimit),
    pagination: {
      total: items.length,
      page: parsedPage,
      pages: Math.ceil(items.length / parsedLimit),
      limit: parsedLimit,
    },
  };
};

const normalizeFoodPayload = (donorId, data) => {
  const normalized = {
    ...data,
    donor: donorId,
    preparedAt: data.preparedAt || data.preparationTime || null,
    foodType: data.foodType || data.category || 'other',
    storageMethod: data.storageMethod || 'room temperature',
    packagingCondition: data.packagingCondition || 'sealed',
    foodAppearance: data.foodAppearance || 'normal',
    odor: data.odor || 'normal',
    contaminationRisk: data.contaminationRisk || 'none',
    hygiene: data.hygiene || 'good',
  };

  const evaluation = evaluateFoodSafety(normalized);
  normalized.foodSafety = evaluation;

  if (new Date(normalized.expiryTime) < new Date()) {
    normalized.status = 'expired';
  }

  return normalized;
};

const createFood = async (donorId, data) => {
  const payload = normalizeFoodPayload(donorId, data);
  const food = await Food.create(payload);
  return await food.populate('donor', 'name email phone organization');
};

const getAllFoods = async (query = {}) => {
  const { page = 1, limit = 10, sortBy } = query;

  const now = new Date();
  await Food.updateMany(
    { expiryTime: { $lt: now }, status: 'available' },
    { status: 'expired' }
  );

  const filter = buildFoodFilter(query);
  const foods = await Food.find(filter)
    .populate('donor', 'name email phone organization')
    .sort({ createdAt: -1 });

  const lat = toNumber(query.lat);
  const lng = toNumber(query.lng);
  const rankedFoods = foods
    .map((food) => attachDerivedMetrics(food, lat !== null && lng !== null ? { lat, lng } : null))
    .filter((food) => food.foodSafety?.status !== 'UNSAFE' || (query.includeUnsafe === 'true'));

  const filteredFoods = applyDistanceFilter(rankedFoods, query);
  const finalFoods = sortFoods(filteredFoods, sortBy || 'recommended');
  const { items, pagination } = paginate(finalFoods, page, limit);

  return {
    foods: items,
    pagination,
  };
};

const getFoodById = async (foodId) => {
  const food = await Food.findById(foodId).populate('donor', 'name email phone organization');
  if (!food) throw new AppError('Food listing not found.', 404);
  return attachDerivedMetrics(food);
};

const getDonorFoods = async (donorId, query = {}) => {
  const { page = 1, limit = 10, sortBy } = query;

  const now = new Date();
  await Food.updateMany(
    { expiryTime: { $lt: now }, status: 'available' },
    { status: 'expired' }
  );

  const filter = buildFoodFilter(query, { donor: donorId });
  const foods = await Food.find(filter).sort({ createdAt: -1 });
  const rankedFoods = foods.map((food) => attachDerivedMetrics(food));
  const filteredFoods = sortFoods(rankedFoods, sortBy || 'created');
  const { items, pagination } = paginate(filteredFoods, page, limit);

  return {
    foods: items,
    pagination,
  };
};

const updateFood = async (foodId, donorId, updates) => {
  const food = await Food.findById(foodId);
  if (!food) throw new AppError('Food listing not found.', 404);

  if (food.donor.toString() !== donorId.toString()) {
    throw new AppError('Not authorized to update this listing.', 403);
  }

  if (['completed', 'expired'].includes(food.status)) {
    throw new AppError(`Cannot update a ${food.status} listing.`, 400);
  }

  const allowedUpdates = [
    'title',
    'description',
    'quantity',
    'expiryTime',
    'preparedAt',
    'foodType',
    'storageMethod',
    'currentStorageTemperature',
    'packagingCondition',
    'foodAppearance',
    'odor',
    'contaminationRisk',
    'hygiene',
    'location',
    'category',
    'images',
  ];

  allowedUpdates.forEach((field) => {
    if (updates[field] !== undefined) food[field] = updates[field];
  });

  const normalized = normalizeFoodPayload(donorId, food.toObject ? food.toObject() : food);
  Object.assign(food, normalized);

  if (new Date(food.expiryTime) < new Date()) {
    food.status = 'expired';
  }

  await food.save();
  return await food.populate('donor', 'name email phone organization');
};

const deleteFood = async (foodId, userId, userRole) => {
  const food = await Food.findById(foodId);
  if (!food) throw new AppError('Food listing not found.', 404);

  if (userRole !== 'ADMIN' && food.donor.toString() !== userId.toString()) {
    throw new AppError('Not authorized to delete this listing.', 403);
  }

  await Request.deleteMany({ food: foodId });
  await Food.findByIdAndDelete(foodId);
  return { message: 'Food listing deleted successfully.' };
};

module.exports = { createFood, getAllFoods, getFoodById, getDonorFoods, updateFood, deleteFood, attachDerivedMetrics, getRecommendedDonationPayload };
