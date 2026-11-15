// M8: the access token lives HERE, in a variable in memory, not in localStorage.
// Any JavaScript on the page can read localStorage; this value can only be reached
// through this module. The price: a reload clears memory and logs the user out.
// A refresh token in an httpOnly cookie is the next step, not this one.
let accessToken: string | null = null;

export const getToken = () => accessToken;

export const setToken = (token: string | null) => {
  accessToken = token;
};
