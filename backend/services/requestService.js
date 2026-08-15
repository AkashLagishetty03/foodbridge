const Request = require('../models/Request');
const Food = require('../models/Food');
const { AppError } = require('../middleware/errorMiddleware');

const createRequest = async (ngoId, { foodId, message, pickupTime }) => {
  const food = await Food.findById(foodId);
  if (!food) throw new AppError('Food listing not found.', 404);

  if (food.status !== 'available') {
    throw new AppError(`This food is no longer available (status: ${food.status}).`, 400);
  }

  if (food.donor.toString() === ngoId.toString()) {
    throw new AppError('You cannot request your own food listing.', 400);
  }

  const existing = await Request.findOne({ food: foodId, ngo: ngoId });
  if (existing) throw new AppError('You have already requested this food listing.', 400);

  const request = await Request.create({
    food: foodId,
    ngo: ngoId,
    donor: food.donor,
    message,
    pickupTime,
  });

  // Mark food as requested
  food.status = 'requested';
  await food.save();

  return await request.populate([
    { path: 'food', select: 'title quantity expiryTime location category' },
    { path: 'ngo', select: 'name email phone organization' },
    { path: 'donor', select: 'name email phone' },
  ]);
};

const getRequestsForDonor = async (donorId, query = {}) => {
  const { status, page = 1, limit = 10 } = query;
  const filter = { donor: donorId };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('food', 'title quantity expiryTime location category status')
      .populate('ngo', 'name email phone organization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Request.countDocuments(filter),
  ]);

  return { requests, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) } };
};

const getRequestsForNGO = async (ngoId, query = {}) => {
  const { status, page = 1, limit = 10 } = query;
  const filter = { ngo: ngoId };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('food', 'title quantity expiryTime location category status')
      .populate('donor', 'name email phone organization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Request.countDocuments(filter),
  ]);

  return { requests, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) } };
};

const updateRequestStatus = async (requestId, donorId, { status, responseNote }) => {
  const request = await Request.findById(requestId);
  if (!request) throw new AppError('Request not found.', 404);

  if (request.donor.toString() !== donorId.toString()) {
    throw new AppError('Not authorized to update this request.', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Request is already ${request.status}.`, 400);
  }

  const allowed = ['accepted', 'rejected'];
  if (!allowed.includes(status)) {
    throw new AppError(`Invalid status. Allowed: ${allowed.join(', ')}`, 400);
  }

  request.status = status;
  if (responseNote) request.responseNote = responseNote;
  await request.save();

  // Update food status accordingly
  const food = await Food.findById(request.food);
  if (food) {
    if (status === 'accepted') {
      food.status = 'requested';
    } else if (status === 'rejected') {
      // Check if there are other pending requests
      const otherPending = await Request.findOne({
        food: food._id,
        status: 'pending',
        _id: { $ne: requestId },
      });
      if (!otherPending) food.status = 'available';
    }
    await food.save();
  }

  return await request.populate([
    { path: 'food', select: 'title quantity expiryTime location status' },
    { path: 'ngo', select: 'name email phone organization' },
    { path: 'donor', select: 'name email' },
  ]);
};

const completeRequest = async (requestId, donorId) => {
  const request = await Request.findById(requestId);
  if (!request) throw new AppError('Request not found.', 404);

  if (request.donor.toString() !== donorId.toString()) {
    throw new AppError('Not authorized.', 403);
  }

  if (request.status !== 'accepted') {
    throw new AppError('Only accepted requests can be completed.', 400);
  }

  request.status = 'completed';
  await request.save();

  await Food.findByIdAndUpdate(request.food, { status: 'completed' });

  return await request.populate([
    { path: 'food', select: 'title quantity' },
    { path: 'ngo', select: 'name email organization' },
  ]);
};

const getAllRequests = async (query = {}) => {
  const { status, page = 1, limit = 20 } = query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('food', 'title quantity status')
      .populate('ngo', 'name email organization')
      .populate('donor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Request.countDocuments(filter),
  ]);

  return { requests, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) } };
};

module.exports = {
  createRequest,
  getRequestsForDonor,
  getRequestsForNGO,
  updateRequestStatus,
  completeRequest,
  getAllRequests,
};
