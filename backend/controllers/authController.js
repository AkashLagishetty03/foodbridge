const { registerUser, loginUser, getProfile } = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, organization } = req.body;
    const { user, token } = await registerUser({ name, email, password, role, phone, organization });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

const profile = async (req, res, next) => {
  try {
    const user = await getProfile(req.user._id);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, profile };
