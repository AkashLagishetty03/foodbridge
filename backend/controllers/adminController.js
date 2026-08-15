const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  adminDeleteFood,
  getAllFoodsAdmin,
} = require('../services/adminService');

const stats = async (req, res, next) => {
  try {
    const data = await getDashboardStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const users = async (req, res, next) => {
  try {
    const result = await getAllUsers(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const removeUser = async (req, res, next) => {
  try {
    const result = await deleteUser(req.params.id, req.user._id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const toggleUser = async (req, res, next) => {
  try {
    const result = await toggleUserStatus(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const removeFood = async (req, res, next) => {
  try {
    const result = await adminDeleteFood(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const foods = async (req, res, next) => {
  try {
    const result = await getAllFoodsAdmin(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { stats, users, removeUser, toggleUser, removeFood, foods };
