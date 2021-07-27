module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>"],
  moduleNameMapper: {
    "filebridge-client": "<rootDir>/packages/filebridge-client/src",
  },
};
