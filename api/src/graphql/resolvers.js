export const resolvers = {
  Query: {
    users: () => [
      { id: "1", email: "dan@gmail.com" },
      { id: "2", email: "han@gmail.com" },
      { id: "3", email: "ban@gmail.com" },
    ],
  },
};
