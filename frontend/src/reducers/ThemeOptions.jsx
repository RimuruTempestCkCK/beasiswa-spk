export const SET_DARK_MODE = 'THEME_OPTIONS/SET_DARK_MODE';

export const setDarkMode = (darkMode) => ({
  type: SET_DARK_MODE,
  darkMode,
});

export default function reducer(
  state = {
    darkMode: 'auto',
  },
  action
) {
  switch (action.type) {
    case SET_DARK_MODE:
      return {
        ...state,
        darkMode: action.darkMode,
      };
    default:
      return state;
  }
}
