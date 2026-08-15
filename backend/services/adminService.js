const User = require('../models/User');
const Food = require('../models/Food');
const Request = require('../models/Request');
const { AppError } = require('../middleware/errorMiddleware');

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalDonors,
    totalNGOs,
    totalFoods,
    availableFoods,
    completedFoods,
    totalRequests,
    pendingRequests,
    completedRequests,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'DONOR' }),
    User.countDocuments({ role: 'NGO' }),
    Food.countDocuments(),
    Food.countDocuments({ status: 'available' }),
    Food.countDocuments({ status: 'completed' }),
    Request.countDocuments(),
    Request.countDocuments({ status: 'pending' }),
    Request.countDocuments({ status: 'completed' }),
  ]);

  return {
    users: { total: totalUsers, donors: totalDonors, ngos: totalNGOs },
    foods: { total: totalFoods, available: availableFoods, completed: completedFoods },
    requests: { total: totalRequests, pending: pendingRequests, completed: completedRequests },
  };
};

const getAllUsers = async (query = {}) => {
  const { role, page = 1, limit = 20, search } = query;
  const filter = {};
  if (role) filter.role = role.toUpperCase();
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  return { users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) } };
};

const deleteUser = async (userId, adminId) => {
  if (userId === adminId.toString()) {
    throw new AppError('You cannot delete your own admin account.', 400);
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  // Cascade: delete user's food and requests
  const userFoods = await Food.find({ donor: userId }).select('_id');
  const foodIds = userFoods.map((f) => f._id);
  await Request.deleteMany({ $or: [{ ngo: userId }, { food: { $in: foodIds } }] });
  await Food.deleteMany({ donor: userId });
  await User.findByIdAndDelete(userId);

  return { message: `User "${user.name}" and all related data deleted.` };
};

const toggleUserStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  user.isActive = !user.isActive;
  await user.save();
  return { user, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.` };
};

const adminDeleteFood = async (foodId) => {
  const food = await Food.findById(foodId);
  if (!food) throw new AppError('Food listing not found.', 404);
  await Request.deleteMany({ food: foodId });
  await Food.findByIdAndDelete(foodId);
  return { message: 'Food listing and related requests deleted.' };
};

const getAllFoodsAdmin = async (query = {}) => {
  const { status, page = 1, limit = 20 } = query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [foods, total] = await Promise.all([
    Food.find(filter)
      .populate('donor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Food.countDocuments(filter),
  ]);

  return { foods, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) } };
};

module.exports = { getDashboardStats, getAllUsers, deleteUser, toggleUserStatus, adminDeleteFood, getAllFoodsAdmin };
