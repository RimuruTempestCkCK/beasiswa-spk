import ThemeOptions from './ThemeOptions';
import authReducer from '../features/auth/authSlice';

const reducer = {
  ThemeOptions,
  auth: authReducer,
};

export default reducer;
