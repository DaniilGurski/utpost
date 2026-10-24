import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: '../api/src/graphql/schema.js',
  documents: ['src/**/*.{vue,ts,tsx}', '!src/gql/**/*'],
  generates: {
    './src/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
      },
    },
  },
}

export default config