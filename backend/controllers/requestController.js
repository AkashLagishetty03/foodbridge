const {
  createRequest,
  getRequestsForDonor,
  getRequestsForNGO,
  updateRequestStatus,
  completeRequest,
  getAllRequests,
} = require('../services/requestService');

const create = async (req, res, next) => {
  try {
    const request = await createRequest(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Request submitted successfully.', data: { request } });
  } catch (error) {
    next(error);
  }
};

const getDonorRequests = async (req, res, next) => {
  try {
    const result = await getRequestsForDonor(req.user._id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getNGORequests = async (req, res, next) => {
  try {
    const result = await getRequestsForNGO(req.user._id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const request = await updateRequestStatus(req.params.id, req.user._id, req.body);
    res.status(200).json({ success: true, message: `Request ${req.body.status}.`, data: { request } });
  } catch (error) {
    next(error);
  }
};

const complete = async (req, res, next) => {
  try {
    const request = await completeRequest(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: 'Request marked as completed.', data: { request } });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await getAllRequests(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getDonorRequests, getNGORequests, updateStatus, complete, getAll };
