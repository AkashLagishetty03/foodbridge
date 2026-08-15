const {
  createFood,
  getAllFoods,
  getFoodById,
  getDonorFoods,
  updateFood,
  deleteFood,
} = require('../services/foodService');

const create = async (req, res, next) => {
  try {
    const food = await createFood(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Food listing created.', data: { food } });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await getAllFoods(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const food = await getFoodById(req.params.id);
    res.status(200).json({ success: true, data: { food } });
  } catch (error) {
    next(error);
  }
};

const getMyFoods = async (req, res, next) => {
  try {
    const result = await getDonorFoods(req.user._id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const food = await updateFood(req.params.id, req.user._id, req.body);
    res.status(200).json({ success: true, message: 'Food listing updated.', data: { food } });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await deleteFood(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getOne, getMyFoods, update, remove };
