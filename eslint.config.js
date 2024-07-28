import antfu from '@antfu/eslint-config'
import perfectionist from 'eslint-plugin-perfectionist'

export default antfu(
  {
    formatters: true,
    jsonc: true,
    stylistic: {
      indent: 2,
      maxLen: 80,
      semi: false,
    },
    typescript: true,
    vue: true,
    yaml: true,
  },
  {
    rules: {
      ...perfectionist.configs['recommended-alphabetical'].rules,
      'perfectionist/sort-imports': 0,
      'perfectionist/sort-named-imports': 0,
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/attributes-order': 0,
      'vue/block-order': ['error', {
        order: ['template', 'script', 'style'],
      }],
      'vue/custom-event-name-casing': ['error', 'kebab-case'],
      'vue/html-closing-bracket-newline': [
        'error',
        {
          multiline: 'never',
          selfClosingTag: {
            multiline: 'never',
            singleline: 'never',
          },
          singleline: 'never',
        },
      ],
      'vue/html-self-closing': ['error', {
        html: {
          component: 'always',
          normal: 'always',
          void: 'never',
        },
        math: 'always',
        svg: 'always',
      }],
    },
  },
)
